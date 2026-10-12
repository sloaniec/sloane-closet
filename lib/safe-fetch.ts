import dns from "node:dns";
import http from "node:http";
import https from "node:https";
import net from "node:net";
import zlib from "node:zlib";
import type { Readable } from "node:stream";

// Fetches a URL from the open internet on behalf of a signed-in user,
// refusing anything that could reach private infrastructure:
// - only http and https
// - every address a host resolves to must be public (checked when the
//   connection is made, so DNS can't change answers between check and use)
// - total time limit, byte limit, and redirect limit

export class SafeFetchError extends Error {}

export type SafeFetchOptions = {
  maxBytes: number;
  timeoutMs: number;
  maxRedirects: number;
  accept: string;
  // true: stop reading at maxBytes and keep what arrived (fine for HTML,
  // whose <head> comes first). false: fail if the body is bigger.
  truncate: boolean;
};

export type SafeFetchResponse = {
  url: string;
  status: number;
  contentType: string;
  body: Buffer;
};

const USER_AGENT =
  "Mozilla/5.0 (compatible; SloanesCloset/1.0; personal link preview)";

// Separate lists: a single BlockList applies IPv4-mapped IPv6 rules
// (::ffff:0:0/96) to plain IPv4 addresses too, which would block everything.
const blockedV4 = new net.BlockList();
const blockedV6 = new net.BlockList();
for (const [address, prefix] of [
  ["0.0.0.0", 8], // "this" network
  ["10.0.0.0", 8], // private
  ["100.64.0.0", 10], // carrier-grade NAT
  ["127.0.0.0", 8], // loopback
  ["169.254.0.0", 16], // link-local, cloud metadata
  ["172.16.0.0", 12], // private
  ["192.0.0.0", 24], // IETF protocol assignments
  ["192.0.2.0", 24], // documentation
  ["192.168.0.0", 16], // private
  ["198.18.0.0", 15], // benchmarking
  ["198.51.100.0", 24], // documentation
  ["203.0.113.0", 24], // documentation
  ["224.0.0.0", 4], // multicast
  ["240.0.0.0", 4], // reserved, broadcast
] as const) {
  blockedV4.addSubnet(address, prefix, "ipv4");
}
for (const [address, prefix] of [
  ["::", 128], // unspecified
  ["::1", 128], // loopback
  ["::ffff:0:0", 96], // IPv4-mapped
  ["64:ff9b::", 96], // NAT64
  ["100::", 64], // discard
  ["2001:db8::", 32], // documentation
  ["2002::", 16], // 6to4 (can wrap private IPv4)
  ["fc00::", 7], // unique local
  ["fe80::", 10], // link-local
  ["ff00::", 8], // multicast
] as const) {
  blockedV6.addSubnet(address, prefix, "ipv6");
}

export function isPublicAddress(address: string): boolean {
  const family = net.isIP(address);
  if (family === 0) return false;
  return family === 4
    ? !blockedV4.check(address, "ipv4")
    : !blockedV6.check(address, "ipv6");
}

type LookupCallback = (
  err: NodeJS.ErrnoException | null,
  address: string | dns.LookupAddress[],
  family?: number,
) => void;

function makeLookup(isAllowed: (address: string) => boolean) {
  return (
    hostname: string,
    options: dns.LookupOptions,
    callback: LookupCallback,
  ) => {
    dns.lookup(hostname, { ...options, all: true }, (err, addresses) => {
      if (err) return callback(err, "");
      const list = addresses as dns.LookupAddress[];
      if (list.length === 0 || list.some((a) => !isAllowed(a.address))) {
        return callback(new SafeFetchError("Address not allowed"), "");
      }
      if (options.all) return callback(null, list);
      callback(null, list[0].address, list[0].family);
    });
  };
}

export function createSafeFetch(isAllowed: (address: string) => boolean) {
  const lookup = makeLookup(isAllowed);

  return async function safeFetch(
    input: string,
    options: SafeFetchOptions,
  ): Promise<SafeFetchResponse> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), options.timeoutMs);
    try {
      let url = parseHttpUrl(input);
      for (let redirects = 0; ; redirects++) {
        const res = await request(url, options.accept, lookup, isAllowed, controller.signal);
        const location = res.headers.location;
        if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && location) {
          res.resume();
          if (redirects >= options.maxRedirects) {
            throw new SafeFetchError("Too many redirects");
          }
          url = parseHttpUrl(new URL(location, url).toString());
          continue;
        }
        const body = await readBody(res, options);
        return {
          url: url.toString(),
          status: res.statusCode ?? 0,
          contentType: String(res.headers["content-type"] ?? ""),
          body,
        };
      }
    } catch (err) {
      if (controller.signal.aborted) throw new SafeFetchError("Timed out");
      throw err;
    } finally {
      clearTimeout(timer);
    }
  };
}

export const safeFetch = createSafeFetch(isPublicAddress);

export function parseHttpUrl(input: string): URL {
  let url: URL;
  try {
    url = new URL(input);
  } catch {
    throw new SafeFetchError("Not a valid link");
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new SafeFetchError("Only http and https links are allowed");
  }
  if (url.username || url.password) {
    throw new SafeFetchError("Links with passwords are not allowed");
  }
  return url;
}

function request(
  url: URL,
  accept: string,
  lookup: ReturnType<typeof makeLookup>,
  isAllowed: (address: string) => boolean,
  signal: AbortSignal,
): Promise<http.IncomingMessage> {
  // IP-address hosts skip DNS, so check them directly.
  const host = url.hostname.replace(/^\[|\]$/g, "");
  if (net.isIP(host) && !isAllowed(host)) {
    return Promise.reject(new SafeFetchError("Address not allowed"));
  }
  const client = url.protocol === "https:" ? https : http;
  return new Promise((resolve, reject) => {
    const req = client.request(url, {
      method: "GET",
      agent: false,
      lookup: lookup as unknown as typeof dns.lookup,
      signal,
      headers: {
        "user-agent": USER_AGENT,
        accept,
        "accept-encoding": "gzip, deflate, br",
        "accept-language": "en-US,en;q=0.9",
      },
    });
    req.on("response", resolve);
    req.on("error", reject);
    req.end();
  });
}

function decoded(res: http.IncomingMessage): Readable {
  switch (String(res.headers["content-encoding"] ?? "").toLowerCase()) {
    case "gzip":
    case "x-gzip":
      return res.pipe(zlib.createGunzip());
    case "deflate":
      return res.pipe(zlib.createInflate());
    case "br":
      return res.pipe(zlib.createBrotliDecompress());
    default:
      return res;
  }
}

async function readBody(
  res: http.IncomingMessage,
  options: SafeFetchOptions,
): Promise<Buffer> {
  const stream = decoded(res);
  const chunks: Buffer[] = [];
  let size = 0;
  try {
    for await (const chunk of stream) {
      const buf = chunk as Buffer;
      if (size + buf.length > options.maxBytes) {
        if (!options.truncate) throw new SafeFetchError("Too large");
        chunks.push(buf.subarray(0, options.maxBytes - size));
        break;
      }
      chunks.push(buf);
      size += buf.length;
    }
  } finally {
    res.destroy();
  }
  return Buffer.concat(chunks);
}

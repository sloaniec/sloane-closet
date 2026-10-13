// Asks `check` every 2 seconds while `stillRunning` says so, for up to a
// minute. Returns the last answer (which may still be running).
export async function pollUntilDone<T>(
  first: T,
  stillRunning: (value: T) => boolean,
  check: (value: T) => Promise<T>,
  { everyMs = 2000, limitMs = 60_000 } = {},
): Promise<T> {
  let value = first;
  const started = Date.now();
  while (stillRunning(value) && Date.now() - started < limitMs) {
    await new Promise((r) => setTimeout(r, everyMs));
    value = await check(value);
  }
  return value;
}

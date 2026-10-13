import Image from "next/image";
import { SignInForm } from "./sign-in-form";

export default function SignInPage() {
  return (
    <main className="flex flex-1 flex-col justify-center px-6 py-12">
      <div className="mx-auto w-full max-w-sm">
        <h1 className="mb-8">
          <Image
            src="/brand/sign.webp"
            alt="Sloane's Closet"
            width={900}
            height={415}
            priority
            sizes="(max-width: 384px) 100vw, 384px"
            className="h-auto w-full drop-shadow-md"
          />
        </h1>
        <div className="rounded-3xl bg-shell/80 p-6 shadow-sm ring-1 ring-seaglass">
          <h2 className="mb-4 text-xl font-semibold">Sign In</h2>
          <SignInForm />
        </div>
      </div>
    </main>
  );
}

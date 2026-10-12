import { SignInForm } from "./sign-in-form";

export default function SignInPage() {
  return (
    <main className="flex flex-1 flex-col justify-center px-6 py-12">
      <div className="mx-auto w-full max-w-sm">
        <h1 className="mb-1 text-center text-3xl font-bold tracking-tight">
          Sloane&apos;s Closet
        </h1>
        <div className="mx-auto mb-8 h-1 w-16 rounded-full bg-gradient-to-r from-sunshine via-gold to-coral-orange" />
        <div className="rounded-3xl bg-shell/80 p-6 shadow-sm ring-1 ring-seaglass">
          <h2 className="mb-4 text-xl font-semibold">Sign In</h2>
          <SignInForm />
        </div>
      </div>
    </main>
  );
}

import { signOut } from "./actions";

export default function ClosetPage() {
  return (
    <main className="flex flex-1 flex-col px-6 pb-10 pt-[max(1.5rem,env(safe-area-inset-top))]">
      <header className="mx-auto flex w-full max-w-2xl items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Sloane&apos;s Closet</h1>
        <form action={signOut}>
          <button
            type="submit"
            className="text-sm font-medium text-seaglass-deep underline-offset-4 hover:underline"
          >
            Sign out
          </button>
        </form>
      </header>
      <div className="mx-auto mt-2 h-1 w-full max-w-2xl rounded-full bg-gradient-to-r from-seaglass via-sunshine to-coral-orange" />

      <section className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center text-center">
        <div className="rounded-3xl bg-shell/80 px-8 py-10 shadow-sm ring-1 ring-seaglass">
          <p className="text-lg">Add clothing item links to build the wardrobe.</p>
        </div>
      </section>
    </main>
  );
}

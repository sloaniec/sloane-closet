import Link from "next/link";
import { AddItemForm } from "./add-item-form";

export default function AddItemPage() {
  return (
    <main className="flex flex-1 flex-col px-6 pb-10 pt-[max(1.5rem,env(safe-area-inset-top))]">
      <header className="mx-auto flex w-full max-w-2xl items-center justify-between">
        <Link href="/" className="btn px-4 py-1.5 text-base">
          ← Closet
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Add an item</h1>
        <span className="w-14" />
      </header>
      <div className="mx-auto mt-2 h-1 w-full max-w-2xl rounded-full bg-gradient-to-r from-seaglass via-sunshine to-coral-orange" />

      <div className="mx-auto mt-6 w-full max-w-md rounded-3xl bg-shell/80 p-6 shadow-sm ring-1 ring-seaglass">
        <AddItemForm />
      </div>
    </main>
  );
}

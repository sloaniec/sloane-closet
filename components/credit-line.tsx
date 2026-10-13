import type { CreditSummary } from "@/lib/spending";

const LOW_CREDITS = 10;

// "42 credits left · 23 try-ons · $1.73 spent"; below 10 the first part
// turns orange.
export function CreditLine({ summary }: { summary: CreditSummary }) {
  const { credits, tryOns, spent } = summary;
  const low = credits !== null && credits < LOW_CREDITS;
  const creditsText =
    credits === null
      ? null
      : credits <= 0
        ? "Out of credits"
        : low
          ? `Only ${credits} ${credits === 1 ? "credit" : "credits"} left`
          : `${credits} credits left`;
  return (
    <p className="text-center text-xs text-seaglass-deep">
      {creditsText && (
        <>
          <span className={low ? "font-semibold text-coral-orange" : ""}>
            {creditsText}
          </span>
          {" · "}
        </>
      )}
      {tryOns} {tryOns === 1 ? "try-on" : "try-ons"} · {spent} spent
    </p>
  );
}

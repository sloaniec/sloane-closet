// FASHN on-demand price per credit ($0.075). Each completed try-on run
// uses 1 credit. Kept in tenths of a cent so totals round correctly.
const TENTHS_OF_A_CENT_PER_CREDIT = 75;

export type CreditSummary = {
  credits: number | null; // null when FASHN can't be reached
  tryOns: number;
  spent: string;
};

export function summarize(
  credits: number | null,
  tryOns: number,
): CreditSummary {
  return {
    credits,
    tryOns,
    spent: new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(Math.round((tryOns * TENTHS_OF_A_CENT_PER_CREDIT) / 10) / 100),
  };
}

import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatAmount(amount: number): string {
  let scaled: number;
  let suffix: string;

  if (amount >= 1_000_000_000_000) {
    scaled = amount / 1_000_000_000_000;
    suffix = "T";
  } else if (amount >= 1_000_000_000) {
    scaled = amount / 1_000_000_000;
    suffix = "B";
  } else if (amount >= 1_000_000) {
    scaled = amount / 1_000_000;
    suffix = "M";
  } else if (amount >= 1_000) {
    scaled = amount / 1_000;
    suffix = "K";
  } else {
    // For numbers less than 1000, return as is, with 2 decimal places if not an integer
    return amount % 1 === 0 ? amount.toString() : amount.toFixed(2);
  }

  // Apply the "shorten the first figures" logic to the 'scaled' number
  // As per the example: 12902.24 T should become 12.9T
  // This implies that if the scaled number is >= 1000, it should be divided by 1000
  // and then formatted to one decimal place, while keeping the original suffix.
  let formattedScaled: string;
  if (scaled >= 1000) {
    formattedScaled = (scaled / 1000).toFixed(1);
  } else {
    // For scaled numbers less than 1000, use the original formatting logic:
    // 2 decimal places if not an integer, otherwise no decimals.
    formattedScaled = scaled % 1 === 0 ? scaled.toString() : scaled.toFixed(2);
  }

  return formattedScaled + suffix;
}

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { formatDistanceToNow, format } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function timeAgo(date: string | Date | number): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

export function fmtDateTime(date: string | Date | number | null): string {
  if (!date) return "—";
  return format(new Date(date), "PP · p");
}

export function initials(name: string): string {
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function caseNumber(seq: number): string {
  return `AG-${2000 + seq}`;
}

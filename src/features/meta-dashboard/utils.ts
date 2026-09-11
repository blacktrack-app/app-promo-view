import { endOfMonth, format, startOfMonth, subDays } from "date-fns";
import type { DateRange } from "./meta-api";

export type PeriodKey = "today" | "yesterday" | "7days" | "30days" | "month";
export const periods: { key: PeriodKey; label: string }[] = [
  { key: "today", label: "Hoje" },
  { key: "yesterday", label: "Ontem" },
  { key: "7days", label: "Últimos 7 dias" },
  { key: "30days", label: "Últimos 30 dias" },
  { key: "month", label: "Este mês" },
];
const iso = (date: Date) => format(date, "yyyy-MM-dd");
export function getDateRange(period: PeriodKey): DateRange {
  const today = new Date();
  if (period === "today") return { since: iso(today), until: iso(today) };
  if (period === "yesterday") { const date = subDays(today, 1); return { since: iso(date), until: iso(date) }; }
  if (period === "30days") return { since: iso(subDays(today, 29)), until: iso(today) };
  if (period === "month") return { since: iso(startOfMonth(today)), until: iso(endOfMonth(today)) };
  return { since: iso(subDays(today, 6)), until: iso(today) };
}
export const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
export const integer = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 });
export const percent = (value: number) => `${value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
export const shortDate = (value: string) => value ? value.split("-").reverse().slice(0, 2).join("/") : "";

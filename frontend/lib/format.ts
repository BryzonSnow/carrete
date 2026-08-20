import type { BankDetails } from "./types";

export function clp(amount: number) {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatWhen(iso: string) {
  const { date, time } = formatWhenParts(iso);
  return `${date} · ${time}`;
}

export function formatWhenParts(iso: string) {
  const d = new Date(iso);
  const date = new Intl.DateTimeFormat("es-CL", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "America/Santiago",
  }).format(d);
  const time = new Intl.DateTimeFormat("es-CL", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/Santiago",
  }).format(d);
  return { date, time };
}

export function toLocalInput(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function parseLocalInput(value: string) {
  const [date, time = "20:00"] = (value || "").split("T");
  const [year, month, day] = (date || "").split("-").map(Number);
  const [hour, minute] = (time || "20:00").split(":").map(Number);
  const parsed = new Date(year, (month || 1) - 1, day || 1, hour || 0, minute || 0, 0, 0);
  if (!year || Number.isNaN(parsed.getTime())) {
    const fallback = new Date();
    fallback.setDate(fallback.getDate() + 1);
    fallback.setHours(20, 0, 0, 0);
    return fallback;
  }
  return parsed;
}

export function defaultStartsAt() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(20, 0, 0, 0);
  return toLocalInput(d);
}

export function transferText(bank: BankDetails, amount: number, glosa: string) {
  const lines = [
    bank.holder,
    bank.rut,
    bank.bank_name,
    bank.account_type,
    bank.account_number,
  ];
  if (amount > 0) lines.push(`Monto: ${clp(amount)}`);
  if (glosa) lines.push(glosa);
  return lines.filter(Boolean).join("\n");
}

export function mapsUrl(address: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}

export function origin() {
  if (typeof window === "undefined") return "";
  return window.location.origin;
}

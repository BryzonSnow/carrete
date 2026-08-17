import type { Metadata } from "next";
import { Figtree, Syne } from "next/font/google";
import Link from "next/link";
import { PixelMark } from "@/components/PixelArt";
import "./globals.css";

const syne = Syne({
  subsets: ["latin"],
  variable: "--font-syne",
});

const figtree = Figtree({
  subsets: ["latin"],
  variable: "--font-figtree",
});

export const metadata: Metadata = {
  title: "Carrete — organiza el asado",
  description: "Quién vai, qué lleva cada uno, y la cuota. Un link, sin login.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className={`${syne.variable} ${figtree.variable} antialiased`}>
        <div className="grain" />
        <div className="relative mx-auto min-h-screen max-w-3xl px-4 pb-16 pt-6 lg:max-w-5xl">
          <nav className="mb-8 flex items-center justify-between">
            <Link href="/" className="font-display flex items-center gap-2 text-xl tracking-tight">
              <PixelMark size={22} />
              carrete
            </Link>
            <span className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">beta 0.1</span>
          </nav>
          {children}
        </div>
      </body>
    </html>
  );
}

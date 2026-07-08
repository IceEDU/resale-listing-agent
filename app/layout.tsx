import type { Metadata, Viewport } from "next";
import Link from "next/link";
import BottomNav from "@/components/BottomNav";
import "./globals.css";

export const metadata: Metadata = {
  title: "Listing Agent",
  description:
    "Photograph an item, get AI pricing insights, and post it to multiple marketplaces from one place.",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "Listing Agent", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = {
  themeColor: "#09090b",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body>
        <header className="sticky top-0 z-10 border-b border-white/5 bg-zinc-950/80 backdrop-blur">
          <div className="mx-auto flex h-14 max-w-2xl items-center px-4">
            <Link href="/" className="text-base font-semibold tracking-tight">
              Listing{" "}
              <span className="bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">
                Agent
              </span>
            </Link>
          </div>
        </header>
        <main className="mx-auto max-w-2xl px-4 pb-32 pt-4">{children}</main>
        <BottomNav />
      </body>
    </html>
  );
}

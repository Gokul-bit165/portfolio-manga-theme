import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import type { ReactNode } from "react";
import "./globals.css";

/*
 * D4 (provisional, awaiting the owner's review). Cormorant carries the engraved, old-book
 * voice at display sizes. Plex Sans and Plex Mono are one engineered family, so body and
 * metadata read as the same hand. Three files, all from the DESIGN_SYSTEM.md candidates.
 */
const display = Cormorant_Garamond({
  subsets: ["latin"],
  weight: "500",
  variable: "--font-cormorant",
  display: "swap",
});

const body = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-plex-sans",
  display: "swap",
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-plex-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Gokul — The Journey of an Engineer",
  description:
    "Portfolio of Gokul, CSE — Artificial Intelligence and Data Science at Bannari Amman Institute of Technology. A story told through ink, imagination and engineering.",
};

export const viewport: Viewport = { themeColor: "#181715" };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  );
}

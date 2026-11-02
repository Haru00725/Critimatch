import type { Metadata } from "next";
import { Playfair_Display, Source_Sans_3 } from "next/font/google";
import "./globals.css";
import Nav from "@/components/Nav";

const display = Playfair_Display({ subsets: ["latin"], variable: "--font-display" });
const sans = Source_Sans_3({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "CritiMatch: AI-powered emergency resource system",
  description: "Find blood, oxygen cylinders, ICU beds and ventilators from live facility inventory.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable}`}>
      <body className="min-h-screen">
        <Nav />
        <main>{children}</main>
        <footer className="mx-auto max-w-6xl px-5 py-10 text-sm text-mute">
          CritiMatch helps you find resources. It does not replace emergency medical services. In a life-threatening emergency, call 112.
        </footer>
      </body>
    </html>
  );
}

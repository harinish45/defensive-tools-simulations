import type { Metadata } from "next";
import { IBM_Plex_Sans, IBM_Plex_Mono, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";

const sans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-sans",
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-geist-mono",
});

const grotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-grotesk",
});

export const metadata: Metadata = {
  title: {
    default: "Defense OS — Defensive Security Simulation Platform",
    template: "%s | Defense OS",
  },
  description:
    "A hands-on defensive cybersecurity toolkit. Analyze passwords, detect phishing, hunt threats, parse logs and compute subnets — 100% client-side, runs fully on localhost.",
  keywords: [
    "cybersecurity",
    "soc",
    "blue team",
    "phishing analyzer",
    "threat hunting",
    "log analysis",
    "password entropy",
    "subnet calculator",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`dark ${sans.variable} ${mono.variable} ${grotesk.variable}`}>
      <body className="flex h-screen overflow-hidden font-sans antialiased selection:bg-primary/30">
        <Sidebar />
        <div className="relative flex min-w-0 flex-1 flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
            <div className="mx-auto max-w-7xl">{children}</div>
          </main>
        </div>
      </body>
    </html>
  );
}

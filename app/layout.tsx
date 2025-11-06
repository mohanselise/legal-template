import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/header";
import Footer from "@/components/footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Free Legal Template Generator | Professional Legal Documents in Minutes",
  description: "Generate customized legal documents instantly with our free template generator. Employment agreements, NDAs, founder agreements, and more. No legal jargon, 100% free, no sign-up required.",
  keywords: ["legal templates", "free legal documents", "employment agreement", "NDA template", "founders agreement", "legal document generator", "free contract templates"],
  authors: [{ name: "Legal Templates" }],
  icons: {
    icon: "/favicon.png",
    apple: "/favicon.png",
    shortcut: "/favicon.png",
  },
  openGraph: {
    title: "Free Legal Template Generator | Professional Legal Documents",
    description: "Generate customized, plain-English legal documents in minutes. Completely free, no sign-up required.",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Free Legal Template Generator",
    description: "Generate professional legal documents in minutes. 100% free, no sign-up required.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col min-h-screen`}
      >
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}

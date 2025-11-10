import type { Metadata } from "next";
import { Open_Sans } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { Toaster } from "@/components/ui/sonner";

// SELISE Brand Typography System
// Primary: Aptos (headlines, primary headings)
// Secondary: Bahnschrift (subheadings, supporting text)
// Body: Open Sans (body text, standard content)

const openSans = Open_Sans({
  variable: "--font-open-sans",
  subsets: ["latin"],
  display: "swap",
});

const aptos = localFont({
  src: [
    {
      path: "../public/fonts/aptos/aptos-regular.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../public/fonts/aptos/aptos-bold.ttf",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-aptos",
  display: "swap",
  fallback: ["system-ui", "sans-serif"],
});

const bahnschrift = localFont({
  src: "../public/fonts/bahnschrift/bahnschrift-regular.ttf",
  variable: "--font-bahnschrift",
  display: "swap",
  fallback: ["system-ui", "sans-serif"],
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
        className={`${openSans.variable} ${aptos.variable} ${bahnschrift.variable} antialiased flex flex-col min-h-screen`}
      >
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { Open_Sans } from "next/font/google";
import localFont from "next/font/local";
import { ClerkProvider } from '@clerk/nextjs';
import "./globals.css";

// SELISE Brand Typography System
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
  title: "Free Legal Template Generator | Professional Legal Documents",
  description: "Generate customized legal documents instantly with our free template generator.",
};

// Root layout provides HTML structure for all routes
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body
          className={`${openSans.variable} ${aptos.variable} ${bahnschrift.variable} antialiased`}
        >
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}

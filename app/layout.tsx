import type { Metadata } from "next";
import localFont from "next/font/local";
import { ClerkProvider } from '@clerk/nextjs';
import { GoogleAnalytics } from '@next/third-parties/google';
import { ClarityProvider } from '@/components/providers/ClarityProvider';
import "./globals.css";

// SELISE Brand Typography System
// Using Aptos for body text until Open Sans local fonts are available
// Aptos is the primary brand typeface and suitable for body text
const openSans = localFont({
  src: [
    {
      path: "../public/fonts/aptos/aptos-regular.ttf",
      weight: "400",
      style: "normal",
    },
  ],
  variable: "--font-open-sans",
  display: "swap",
  fallback: ["system-ui", "sans-serif"],
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
  const gaMeasurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body
          className={`${openSans.variable} ${aptos.variable} ${bahnschrift.variable} antialiased`}
        >
          <ClarityProvider>
            {children}
          </ClarityProvider>
          {gaMeasurementId && (
            <GoogleAnalytics gaId={gaMeasurementId} />
          )}
        </body>
      </html>
    </ClerkProvider>
  );
}

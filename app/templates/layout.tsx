import type { Metadata } from "next";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: "Legal Templates Library | SELISE Legal Template Generator",
  description:
    "Browse SELISE's library of free legal templates. Generate employment agreements today and preview upcoming documents we are preparing for release.",
};

export default function TemplatesLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <Toaster position="top-center" richColors />
    </div>
  );
}


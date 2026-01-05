import type { Metadata } from "next";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import Header from "@/components/header";
import Footer from "@/components/footer";
import { ConditionalFooter } from "@/components/conditional-footer";
import { Toaster } from "@/components/ui/sonner";
import { JsonLd } from "@/components/json-ld";

export function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Metadata {
  const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://legal-template-generator.selise.ch';
  
  return {
    metadataBase: new URL(BASE_URL),
    title: "Free Legal Template Generator | Professional Legal Documents in Minutes",
    description: "Generate customized legal documents instantly with our free template generator. Employment agreements, NDAs, founder agreements, and more. No legal jargon, 100% free, no sign-up required.",
    keywords: ["legal templates", "free legal documents", "employment agreement", "NDA template", "founders agreement", "legal document generator", "free contract templates"],
    authors: [{ name: "Legal Templates" }],
    icons: {
      icon: "/favicon.png",
      apple: "/favicon.png",
      shortcut: "/favicon.png",
    },
    manifest: '/manifest.json',
    openGraph: {
      title: "Free Legal Template Generator | Professional Legal Documents",
      description: "Generate customized, plain-English legal documents in minutes. Completely free, no sign-up required.",
      type: "website",
      locale: "en_US",
      alternateLocale: "de_DE",
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
    alternates: {
      languages: {
        'en': '/en',
        'de': '/de',
        'x-default': '/en',
      },
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;
  
  // Ensure that the incoming `locale` is valid
  if (!routing.locales.includes(locale as any)) {
    notFound();
  }

  // Providing all messages to the client side
  const messages = await getMessages();
  const t = await getTranslations('common');
  const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://legal-template-generator.selise.ch';

  const jsonLdData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": t('legalTemplates'),
    "url": BASE_URL,
    "logo": `${BASE_URL}/favicon.png`,
    "sameAs": [
      "https://selisegroup.com"
    ]
  };

  return (
    <>
      <JsonLd data={jsonLdData} />
      <NextIntlClientProvider locale={locale} messages={messages}>
        <div className="flex flex-col min-h-screen" lang={locale}>
          <Header />
          <main className="flex-1">{children}</main>
          <ConditionalFooter>
            <Footer />
          </ConditionalFooter>
          <Toaster position="top-center" richColors />
        </div>
      </NextIntlClientProvider>
    </>
  );
}

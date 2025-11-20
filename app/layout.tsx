// This is a minimal root layout required by Next.js
// The actual layout with i18n is in app/[locale]/layout.tsx
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}

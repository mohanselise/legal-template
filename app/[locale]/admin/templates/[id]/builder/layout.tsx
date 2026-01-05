/**
 * Builder Layout - Bypasses the admin shell for full-screen builder experience
 * The builder has its own header and navigation
 */
export default function BuilderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Return children directly - the TypeformBuilder component provides its own full-height layout
  return <>{children}</>;
}


import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={`min-h-screen bg-[hsl(var(--bg))] ${inter.className}`}>
      <div className="flex min-h-screen flex-col">
        {/* Minimal header with logo only */}
        <header className="border-b border-[hsl(var(--border))] bg-white">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-center px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-2">
              <svg
                className="h-8 w-8 text-[hsl(var(--selise-blue))]"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
              <span className="font-[family-name:var(--font-aptos)] text-xl font-bold text-[hsl(var(--fg))]">
                Legal Templates
              </span>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}

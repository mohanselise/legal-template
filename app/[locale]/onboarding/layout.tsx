import { Inter } from "next/font/google";
import Image from "next/image";

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
            <Image
              src="/Selise Legal Templates.svg"
              alt="SELISE Legal Templates"
              width={200}
              height={40}
              className="h-10 w-auto"
              priority
            />
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}

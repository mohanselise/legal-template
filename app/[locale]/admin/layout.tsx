import { UserButton } from '@clerk/nextjs';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[hsl(var(--gradient-light-from))] to-[hsl(var(--gradient-light-to))]">
      <div className="border-b border-[hsl(var(--border))] bg-[hsl(var(--bg))]">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-6">
            <h2 className="text-lg font-semibold text-[hsl(var(--selise-blue))]">
              Admin Portal
            </h2>
            <nav className="hidden md:flex gap-4">
              <a
                href="/admin"
                className="text-sm font-medium text-[hsl(var(--fg))] hover:text-[hsl(var(--selise-blue))] transition-colors"
              >
                Dashboard
              </a>
              <a
                href="/admin/templates"
                className="text-sm font-medium text-[hsl(var(--globe-grey))] hover:text-[hsl(var(--selise-blue))] transition-colors"
              >
                Templates
              </a>
              <a
                href="/admin/users"
                className="text-sm font-medium text-[hsl(var(--globe-grey))] hover:text-[hsl(var(--selise-blue))] transition-colors"
              >
                Users
              </a>
            </nav>
          </div>
          <UserButton afterSignOutUrl="/" />
        </div>
      </div>
      {children}
    </div>
  );
}

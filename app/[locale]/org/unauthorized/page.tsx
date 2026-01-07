import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ShieldX, ArrowLeft } from "lucide-react";

export default async function OrgUnauthorizedPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[hsl(var(--gradient-light-from))] to-[hsl(var(--gradient-light-to))]">
      <div className="text-center max-w-md mx-auto px-4">
        <div className="flex justify-center mb-6">
          <div className="p-4 rounded-full bg-[hsl(var(--crimson))]/10">
            <ShieldX className="h-12 w-12 text-[hsl(var(--crimson))]" />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-[hsl(var(--fg))] font-heading mb-2">
          Access Denied
        </h1>

        <p className="text-[hsl(var(--globe-grey))] mb-6">
          You don&apos;t have permission to access this organization. This
          could be because you&apos;re not a member or your membership has been
          revoked.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild variant="outline">
            <Link href={`/${locale}`}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Home
            </Link>
          </Button>
          <Button asChild>
            <Link href={`/${locale}/templates`}>Browse Templates</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

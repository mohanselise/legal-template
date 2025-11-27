import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { ArrowLeft, Clock, FileText, Sparkles, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DynamicSmartFlow } from "@/components/smart-flow/DynamicSmartFlow";

interface Props {
  params: Promise<{ locale: string; slug: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;

  const template = await prisma.template.findUnique({
    where: { slug },
  });

  if (!template) {
    return { title: "Template Not Found" };
  }

  return {
    title: `Generate ${template.title} | SELISE Legal Templates`,
    description: template.description,
  };
}

export default async function TemplateGeneratePage({ params }: Props) {
  const { locale, slug } = await params;

  // Fetch template with screens and fields from database
  const template = await prisma.template.findUnique({
    where: { slug },
    include: {
      screens: {
        orderBy: { order: "asc" },
        include: {
          fields: {
            orderBy: { order: "asc" },
          },
        },
      },
    },
  });

  if (!template) {
    notFound();
  }

  // For templates with specific implementations, redirect to them
  // This maintains backward compatibility while we build out the generic system
  if (slug === "employment-agreement") {
    redirect(`/${locale}/templates/employment-agreement/generate`);
  }

  // For templates that aren't available yet, show coming soon page
  if (!template.available) {
    return (
      <div className="container max-w-4xl py-16">
        <Link
          href={`/${locale}/templates`}
          className="inline-flex items-center gap-2 text-sm text-[hsl(var(--globe-grey))] hover:text-[hsl(var(--selise-blue))] mb-8 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Templates
        </Link>

        <Card className="border-[hsl(var(--border))]">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-[hsl(var(--selise-blue)/0.1)] flex items-center justify-center mb-4">
              <Sparkles className="h-8 w-8 text-[hsl(var(--selise-blue))]" />
            </div>
            <CardTitle className="text-2xl font-bold text-[hsl(var(--fg))]">
              {template.title}
            </CardTitle>
            <CardDescription className="text-base max-w-xl mx-auto">
              {template.description}
            </CardDescription>
          </CardHeader>

          <CardContent className="text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[hsl(var(--lime-green)/0.1)] text-[hsl(var(--poly-green))]">
              <Clock className="h-4 w-4" />
              <span className="text-sm font-medium">Coming Soon</span>
            </div>

            <p className="text-[hsl(var(--globe-grey))] max-w-md mx-auto">
              We&apos;re working hard to bring you this template. Sign up for
              updates to be notified when it&apos;s ready.
            </p>

            {template.estimatedMinutes && (
              <p className="text-sm text-[hsl(var(--globe-grey))]">
                <FileText className="inline h-4 w-4 mr-1" />
                Estimated completion time: {template.estimatedMinutes} minutes
              </p>
            )}

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button
                asChild
                className="bg-[hsl(var(--selise-blue))] hover:bg-[hsl(var(--oxford-blue))]"
              >
                <Link href={`/${locale}/templates`}>Browse Available Templates</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href={`/${locale}`}>Back to Home</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check if template has screens configured
  const hasScreens = template.screens.length > 0;

  // If screens are configured, render the dynamic wizard
  if (hasScreens) {
    const config = {
      id: template.id,
      slug: template.slug,
      title: template.title,
      description: template.description,
      screens: template.screens,
    };

    return <DynamicSmartFlow config={config} locale={locale} />;
  }

  // For available templates without screens configured
  // Show a message to admins to set up the form
  return (
    <div className="container max-w-4xl py-16">
      <Link
        href={`/${locale}/templates`}
        className="inline-flex items-center gap-2 text-sm text-[hsl(var(--globe-grey))] hover:text-[hsl(var(--selise-blue))] mb-8 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Templates
      </Link>

      <Card className="border-[hsl(var(--border))]">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-[hsl(var(--selise-blue)/0.1)] flex items-center justify-center mb-4">
            <Settings className="h-8 w-8 text-[hsl(var(--selise-blue))]" />
          </div>
          <CardTitle className="text-2xl font-bold text-[hsl(var(--fg))]">
            {template.title}
          </CardTitle>
          <CardDescription className="text-base max-w-xl mx-auto">
            {template.description}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-6">
          <p className="text-[hsl(var(--globe-grey))] max-w-md mx-auto">
            This template is marked as available but needs form configuration.
            Please set up the form screens and fields in the admin panel.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Button
              asChild
              className="bg-[hsl(var(--selise-blue))] hover:bg-[hsl(var(--oxford-blue))]"
            >
              <Link href={`/${locale}/admin/templates/${template.id}/builder`}>
                <Settings className="h-4 w-4 mr-2" />
                Configure Form
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={`/${locale}/templates`}>Browse Templates</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

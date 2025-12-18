import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, FileText, Settings, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DynamicSmartFlow } from "@/components/smart-flow/DynamicSmartFlow";

interface Props {
  params: Promise<{ locale: string; slug: string }>;
  searchParams: Promise<{ preview?: string }>;
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

export default async function TemplateGeneratePage({ params, searchParams }: Props) {
  const { locale, slug } = await params;
  const { preview } = await searchParams;

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

  // Check if preview token is valid for draft templates
  const isPreviewMode = !template.available && preview && template.previewToken && preview === template.previewToken;

  // For templates that aren't available yet, show coming soon page (unless in preview mode)
  if (!template.available && !isPreviewMode) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[hsl(var(--bg))] to-[hsl(var(--gradient-light-to))]">
        <div className="container max-w-4xl mx-auto px-4 py-12 sm:py-16 lg:py-24">
          <Link
            href={`/${locale}/templates`}
            className="inline-flex items-center gap-2 text-sm font-medium text-[hsl(var(--globe-grey))] hover:text-[hsl(var(--selise-blue))] mb-12 transition-colors group"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            Back to Templates
          </Link>

          <div className="relative">
            {/* Decorative background elements */}
            <div className="absolute -top-8 -left-8 w-64 h-64 bg-[hsl(var(--selise-blue)/0.05)] rounded-full blur-3xl -z-10" />
            <div className="absolute -bottom-8 -right-8 w-64 h-64 bg-[hsl(var(--sky-blue)/0.05)] rounded-full blur-3xl -z-10" />

            <Card className="border-[hsl(var(--border))] shadow-xl bg-[hsl(var(--card))] backdrop-blur-sm relative overflow-hidden">
              {/* Subtle gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-[hsl(var(--selise-blue)/0.02)] via-transparent to-[hsl(var(--sky-blue)/0.02)] pointer-events-none" />
              
              <CardHeader className="text-center pb-6 pt-12 px-6 sm:px-8 relative">
                <div className="mx-auto w-20 h-20 rounded-2xl bg-gradient-to-br from-[hsl(var(--selise-blue)/0.15)] to-[hsl(var(--sky-blue)/0.15)] flex items-center justify-center mb-6 shadow-lg p-3">
                  <Image
                    src="/Selise Legal Templates.svg"
                    alt="SELISE Legal Templates"
                    width={56}
                    height={56}
                    className="w-full h-full object-contain"
                  />
                </div>
                
                <CardTitle className="text-3xl sm:text-4xl font-bold text-[hsl(var(--fg))] mb-4 font-heading">
                  {template.title}
                </CardTitle>
                <CardDescription className="text-base sm:text-lg text-[hsl(var(--globe-grey))] max-w-2xl mx-auto leading-relaxed">
                  {template.description}
                </CardDescription>
              </CardHeader>

              <CardContent className="text-center space-y-8 px-6 sm:px-8 pb-12 relative">
                <div className="space-y-4">
                  <p className="text-[hsl(var(--globe-grey))] max-w-lg mx-auto text-base leading-relaxed">
                    We&apos;re working hard to bring you this template. Please check back later.
                  </p>

                  {template.estimatedMinutes && (
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[hsl(var(--bg))] border border-[hsl(var(--border))] text-sm text-[hsl(var(--globe-grey))]">
                      <FileText className="h-4 w-4 text-[hsl(var(--selise-blue))]" />
                      <span>Estimated completion time: <strong className="text-[hsl(var(--fg))]">{template.estimatedMinutes} minutes</strong></span>
                    </div>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
                  <Button
                    asChild
                    size="lg"
                    className="bg-[hsl(var(--selise-blue))] hover:bg-[hsl(var(--oxford-blue))] text-[hsl(var(--white))] hover:text-[hsl(var(--white))] shadow-lg hover:shadow-xl transition-all px-8"
                  >
                    <Link href={`/${locale}/templates`}>Browse Available Templates</Link>
                  </Button>
                  <Button 
                    asChild 
                    variant="outline" 
                    size="lg"
                    className="border-[hsl(var(--border))] hover:bg-[hsl(var(--bg))] px-8"
                  >
                    <Link href={`/${locale}`}>Back to Home</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
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

    return (
      <div className="relative">
        {/* Preview Mode Banner */}
        {isPreviewMode && (
          <div className="sticky top-0 z-50 bg-[hsl(var(--selise-blue))]/10 border-b border-[hsl(var(--selise-blue))]/20 px-4 py-2">
            <div className="container max-w-7xl mx-auto flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-[hsl(var(--selise-blue))]" />
                <Badge variant="outline" className="bg-[hsl(var(--selise-blue))]/10 text-[hsl(var(--selise-blue))] border-[hsl(var(--selise-blue))]/30">
                  Preview Mode
                </Badge>
                <span className="text-sm text-[hsl(var(--globe-grey))]">
                  This template is in draft and not publicly available
                </span>
              </div>
            </div>
          </div>
        )}
        <DynamicSmartFlow config={config} locale={locale} />
      </div>
    );
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
              className="bg-[hsl(var(--selise-blue))] hover:bg-[hsl(var(--oxford-blue))] text-[hsl(var(--white))] hover:text-[hsl(var(--white))]"
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

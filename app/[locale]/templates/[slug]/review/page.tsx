"use client";

import { useEffect, useState, Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TemplatePDFReview } from "@/components/template-review/TemplatePDFReview";
import { loadTemplateReview } from "@/components/template-review/TemplateReviewStorage";
import type { LegalDocument } from "@/app/api/templates/employment-agreement/schema";

interface ReviewData {
  document: LegalDocument;
  formData: Record<string, any>;
  templateId: string;
  templateSlug: string;
  templateTitle: string;
  storedAt: string;
}

function ReviewContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const slug = params.slug as string;
  const locale = params.locale as string;

  const [reviewData, setReviewData] = useState<ReviewData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Try to get review data from sessionStorage
    const stored = loadTemplateReview(slug);
    if (stored) {
      setReviewData(stored);
      setIsLoading(false);
      return;
    }

    // Try to get from URL params (fallback)
    const docParam = searchParams.get("document");
    const dataParam = searchParams.get("data");

    if (docParam) {
      try {
        const parsedDocument: LegalDocument = JSON.parse(docParam);
        let parsedFormData: Record<string, any> = {};

        if (dataParam) {
          try {
            const dataContent = decodeURIComponent(dataParam);
            parsedFormData = JSON.parse(dataContent);
          } catch {
            // Try without decoding
            parsedFormData = JSON.parse(dataParam);
          }
        }

        // We need template info - try to get from document metadata or use defaults
        const reviewPayload: ReviewData = {
          document: parsedDocument,
          formData: parsedFormData,
          templateId: parsedDocument.metadata.documentType || slug,
          templateSlug: slug,
          templateTitle: parsedDocument.metadata.title || "Legal Document",
          storedAt: parsedDocument.metadata.generatedAt || new Date().toISOString(),
        };
        setReviewData(reviewPayload);
      } catch (err) {
        console.error("Failed to parse document JSON:", err);
        setError("Failed to load document. Please try generating again.");
      }
    } else {
      setError("We could not load your generated document. Please try generating again.");
    }

    setIsLoading(false);
  }, [slug, searchParams]);

  const handleBack = () => {
    router.push(`/${locale}/templates/${slug}/generate`);
  };

  if (isLoading) {
    return (
      <div className="container max-w-4xl py-16">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-[hsl(var(--selise-blue))]" />
        </div>
      </div>
    );
  }

  if (error || !reviewData) {
    return (
      <div className="container max-w-4xl py-16">
        <Card>
          <CardHeader>
            <CardTitle className="text-destructive">Review Data Not Found</CardTitle>
            <CardDescription>
              {error ||
                "The document review data could not be found. Please generate the document again."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
              <Link href={`/${locale}/templates/${slug}/generate`}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Generator
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <TemplatePDFReview
      document={reviewData.document}
      formData={reviewData.formData}
      templateSlug={reviewData.templateSlug}
      templateTitle={reviewData.templateTitle}
      locale={locale}
      onBack={handleBack}
    />
  );
}

export default function TemplateReviewPage() {
  return (
    <Suspense
      fallback={
        <div className="container max-w-4xl py-16">
          <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin text-[hsl(var(--selise-blue))]" />
          </div>
        </div>
      }
    >
      <ReviewContent />
    </Suspense>
  );
}

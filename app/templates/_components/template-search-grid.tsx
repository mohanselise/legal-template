"use client";

import NextLink from "next/link";
import { Link as I18nLink } from "@/i18n/routing";
import { useMemo, useRef, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Briefcase,
  Building,
  ClipboardList,
  FileCheck,
  FilePlus,
  FileSearch,
  FileText,
  Files,
  Folder,
  Handshake,
  Lock,
  Scale,
  Search,
  Shield,
  Sparkles,
  UserCheck,
  Users,
  XCircle,
} from "lucide-react";

type TemplateCard = {
  id: string | number;
  title: string;
  description: string;
  href: string;
  popular: boolean;
  iconName?: string;
};

type TemplateSearchGridProps = {
  templates: TemplateCard[];
  ctaLabel: string;
  liveBadgeLabel: string;
  popularBadgeLabel: string;
  searchPlaceholder: string;
  noResultsText: string;
  resultsLabelTemplate?: string;
  resultsLabelText?: string;
  clearLabel?: string;
  clearSearchLabel?: string;
  useLocalizedLink?: boolean;
  mode?: "client" | "server";
  initialQuery?: string;
  currentPage?: number;
  totalResults?: number;
  pageSize?: number;
  searchParamKey?: string;
  pageParamKey?: string;
};

const iconMap: Record<string, LucideIcon> = {
  Briefcase,
  Building,
  ClipboardList,
  FileCheck,
  FilePlus,
  FileSearch,
  FileText,
  Files,
  Folder,
  Handshake,
  Lock,
  Scale,
  Shield,
  Sparkles,
  UserCheck,
  Users,
};

function resolveIcon(name?: string): LucideIcon {
  if (!name) return FileText;
  return iconMap[name] ?? FileText;
}

export function TemplateSearchGrid({
  templates,
  ctaLabel,
  liveBadgeLabel,
  popularBadgeLabel,
  searchPlaceholder,
  noResultsText,
  resultsLabelTemplate,
  resultsLabelText,
  clearLabel = "Clear",
  clearSearchLabel = "Clear search",
  useLocalizedLink = false,
  mode = "client",
  initialQuery = "",
  currentPage = 1,
  totalResults,
  pageSize = 12,
  searchParamKey = "q",
  pageParamKey = "page",
}: TemplateSearchGridProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(initialQuery);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const normalizedQuery = query.trim().toLowerCase();
  const LinkComponent = useLocalizedLink ? I18nLink : NextLink;

  useEffect(() => {
    if (mode === "server") {
      setQuery(initialQuery);
    }
  }, [initialQuery, mode]);

  const handleQueryChange = (value: string) => {
    setQuery(value);

    if (mode === "server") {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        const params = new URLSearchParams(searchParams?.toString() ?? "");
        if (value.trim()) {
          params.set(searchParamKey, value.trim());
        } else {
          params.delete(searchParamKey);
        }
        params.set(pageParamKey, "1");
        const queryString = params.toString();
        router.push(queryString ? `?${queryString}` : "?", { scroll: false });
      }, 250);
    }
  };

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const filteredTemplates = useMemo(() => {
    if (mode === "server") return templates;
    if (!normalizedQuery) return templates;
    return templates.filter((template) => {
      const haystack = `${template.title} ${template.description}`.toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }, [mode, normalizedQuery, templates]);

  const visibleTemplates = filteredTemplates;
  const visibleCount = visibleTemplates.length;
  const totalCount =
    mode === "server"
      ? totalResults ?? visibleCount
      : filteredTemplates.length;

  const resultsLabel =
    resultsLabelText ||
    (resultsLabelTemplate
      ? resultsLabelTemplate
        .replace("{visible}", visibleCount.toString())
        .replace("{total}", totalCount.toString())
      : "");

  const totalPages =
    mode === "server"
      ? Math.max(1, Math.ceil((totalResults ?? visibleCount) / pageSize))
      : 1;
  const currentPageSafe =
    mode === "server"
      ? Math.min(totalPages, Math.max(1, currentPage))
      : 1;

  const handlePageChange = (targetPage: number) => {
    if (mode !== "server") return;
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    if (query.trim()) {
      params.set(searchParamKey, query.trim());
    } else {
      params.delete(searchParamKey);
    }
    params.set(pageParamKey, targetPage.toString());
    const queryString = params.toString();
    router.push(queryString ? `?${queryString}` : "?", { scroll: false });
  };

  const disablePrev = currentPageSafe <= 1;
  const disableNext = currentPageSafe >= totalPages;

  return (
    <div className="mt-6 space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex w-full items-center gap-3 lg:max-w-md">
          <div className="relative w-full">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              aria-label={searchPlaceholder}
              placeholder={searchPlaceholder}
              value={query}
              onChange={(event) => handleQueryChange(event.target.value)}
              className="pl-10"
            />
            {query ? (
              <button
                type="button"
                aria-label={clearSearchLabel}
                onClick={() => setQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground transition hover:text-foreground"
              >
                <XCircle className="h-4 w-4" />
              </button>
            ) : null}
          </div>
        </div>
        <div className="rounded-xl border border-border bg-[hsl(var(--card))]/80 px-4 py-3 text-sm text-muted-foreground backdrop-blur-sm dark:bg-[hsl(var(--background))]/70">
          {resultsLabel}
        </div>
      </div>

      {visibleTemplates.length === 0 ? (
        <div className="flex items-center justify-between rounded-2xl border border-dashed border-border bg-[hsl(var(--card))]/70 px-6 py-6 text-sm text-muted-foreground backdrop-blur-sm dark:bg-[hsl(var(--background))]/60">
          <span>{noResultsText}</span>
          {query ? (
            <Button variant="ghost" size="sm" onClick={() => setQuery("")}>
              {clearLabel}
            </Button>
          ) : null}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-3">
          {visibleTemplates.map((template) => {
            const Icon = resolveIcon(template.iconName);
            return (
              <Card
                key={template.id}
                className="group flex h-full flex-col justify-between border-2 border-[hsl(var(--selise-blue))]/20 bg-card text-card-foreground transition-all hover:-translate-y-1 hover:border-[hsl(var(--selise-blue))]"
              >
                <CardHeader>
                  <Badge className="w-fit bg-[hsl(var(--selise-blue))]/12 text-[hsl(var(--selise-blue))] font-subheading uppercase tracking-[0.12em]">
                    {template.popular ? popularBadgeLabel : liveBadgeLabel}
                  </Badge>
                  <div className="mt-6 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-[hsl(var(--selise-blue))] to-[hsl(var(--sky-blue))] shadow-lg">
                    <Icon className="h-7 w-7 text-[hsl(var(--white))]" />
                  </div>
                  <CardTitle className="mt-6 text-2xl">{template.title}</CardTitle>
                  <CardDescription className="mt-3 text-base leading-relaxed">
                    {template.description}
                  </CardDescription>
                </CardHeader>
                <CardFooter className="pt-0">
                  <Button
                    asChild
                    className="group w-full bg-[hsl(var(--selise-blue))] text-[hsl(var(--white))] hover:bg-[hsl(var(--oxford-blue))] shadow-md"
                  >
                    <LinkComponent href={template.href}>{ctaLabel}</LinkComponent>
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
      {mode === "server" && totalPages > 1 ? (
        <div className="flex items-center justify-between rounded-2xl border border-border bg-[hsl(var(--card))]/80 px-4 py-3 text-sm text-muted-foreground backdrop-blur-sm dark:bg-[hsl(var(--background))]/70">
          <span>
            Page {currentPageSafe} of {totalPages}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPageSafe - 1)}
              disabled={disablePrev}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPageSafe + 1)}
              disabled={disableNext}
            >
              Next
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

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
  className?: string;
  searchContainerClassName?: string;
  inputClassName?: string;
  searchIconClassName?: string;
  showResultsLabel?: boolean;
  hideSearch?: boolean;
  hideGrid?: boolean;
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
  className,
  searchContainerClassName,
  inputClassName,
  searchIconClassName,
  showResultsLabel = true,
  hideSearch = false,
  hideGrid = false,
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
    <div className={`space-y-6 ${className || ""}`}>
      {!hideSearch && (
        <div className={`flex flex-col gap-4 lg:flex-row lg:items-center ${showResultsLabel ? 'lg:justify-between' : 'lg:justify-center'} lg:gap-6 w-full ${searchContainerClassName || ""}`}>
          <div className={`flex w-full items-center ${showResultsLabel ? 'lg:flex-1 lg:max-w-md' : 'w-full'}`}>
            <div className="relative w-full group">
              {/* Subtle glow effect on focus */}
              <div className="absolute -inset-0.5 rounded-xl bg-gradient-to-r from-[hsl(var(--selise-blue))]/30 via-[hsl(var(--selise-blue))]/20 to-transparent opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 blur-md -z-10" />
              
              <div className="relative">
                <Search className={`pointer-events-none absolute left-5 sm:left-4 top-1/2 h-5 w-5 sm:h-4 sm:w-4 -translate-y-1/2 z-10 transition-all duration-200 ${searchIconClassName || "text-muted-foreground group-focus-within:text-[hsl(var(--selise-blue))] group-focus-within:scale-110"}`} />
                <Input
                  aria-label={searchPlaceholder}
                  placeholder={searchPlaceholder}
                  value={query}
                  onChange={(event) => handleQueryChange(event.target.value)}
                  className={`pl-14 sm:pl-11 pr-14 sm:pr-11 h-16 sm:h-12 text-lg sm:text-base font-normal
                    rounded-xl sm:rounded-lg
                    border-2 sm:border
                    shadow-xl sm:shadow-lg
                    transition-all duration-200 ease-out
                    focus-visible:shadow-2xl focus-visible:shadow-[hsl(var(--selise-blue))]/20
                    focus-visible:border-[hsl(var(--selise-blue))]/50
                    hover:shadow-lg hover:border-[hsl(var(--border))]/80
                    ${inputClassName || ""}`}
                />
                {query ? (
                  <button
                    type="button"
                    aria-label={clearSearchLabel}
                    onClick={() => {
                      setQuery("");
                      handleQueryChange("");
                    }}
                    className="absolute right-4 sm:right-3 top-1/2 -translate-y-1/2 z-10
                      rounded-lg sm:rounded-full p-2.5 sm:p-1.5 
                      text-muted-foreground hover:text-foreground 
                      hover:bg-muted/70 active:bg-muted active:scale-90
                      transition-all duration-200 cursor-pointer touch-manipulation
                      min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0
                      flex items-center justify-center
                      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--selise-blue))] focus-visible:ring-offset-2
                      backdrop-blur-sm"
                  >
                    <XCircle className="h-5 w-5 sm:h-4 sm:w-4" />
                  </button>
                ) : null}
              </div>
            </div>
          </div>
          {showResultsLabel && (
            <div className="flex items-center lg:shrink-0">
              <div className="rounded-xl border border-border bg-[hsl(var(--card))]/80 px-4 py-3 text-sm text-muted-foreground backdrop-blur-sm dark:bg-[hsl(var(--background))]/70 whitespace-nowrap">
                {resultsLabel}
              </div>
            </div>
          )}
        </div>
      )}

      {!hideGrid && (
        <>
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
        </>
      )}
    </div>
  );
}

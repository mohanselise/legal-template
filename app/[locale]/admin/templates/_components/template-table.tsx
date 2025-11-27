"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  FileText,
  Users,
  Lock,
  Shield,
  Sparkles,
  FileCheck,
  FilePlus,
  FileSearch,
  Files,
  Folder,
  Scale,
  Briefcase,
  Building,
  Handshake,
  UserCheck,
  ClipboardList,
  Pencil,
  Trash2,
  Search,
  MoreHorizontal,
  Settings2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { Template } from "@/lib/db";

// Map icon names to components
const iconMap: Record<string, LucideIcon> = {
  FileText,
  Users,
  Lock,
  Shield,
  Sparkles,
  FileCheck,
  FilePlus,
  FileSearch,
  Files,
  Folder,
  Scale,
  Briefcase,
  Building,
  Handshake,
  UserCheck,
  ClipboardList,
};

interface TemplateTableProps {
  templates: Template[];
  onDelete: (template: Template) => void;
}

export function TemplateTable({
  templates,
  onDelete,
}: TemplateTableProps) {
  const [search, setSearch] = useState("");
  const params = useParams();
  const locale = params.locale as string;

  const filteredTemplates = templates.filter(
    (template) =>
      template.title.toLowerCase().includes(search.toLowerCase()) ||
      template.slug.toLowerCase().includes(search.toLowerCase()) ||
      template.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[hsl(var(--globe-grey))]" />
        <Input
          placeholder="Search templates..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Table */}
      <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[hsl(var(--border))] bg-[hsl(var(--muted))]">
                <th className="px-4 py-3 text-left text-sm font-semibold text-[hsl(var(--fg))]">
                  Template
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-[hsl(var(--fg))]">
                  Slug
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-[hsl(var(--fg))]">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-[hsl(var(--fg))]">
                  Popular
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-[hsl(var(--fg))]">
                  Updated
                </th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-[hsl(var(--fg))]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredTemplates.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-12 text-center text-[hsl(var(--globe-grey))]"
                  >
                    {search
                      ? "No templates found matching your search."
                      : "No templates yet. Create your first template to get started."}
                  </td>
                </tr>
              ) : (
                filteredTemplates.map((template) => {
                  const IconComponent = iconMap[template.icon] || FileText;
                  return (
                    <tr
                      key={template.id}
                      className="border-b border-[hsl(var(--border))] last:border-0 hover:bg-[hsl(var(--muted))]/50 transition-colors"
                    >
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex size-10 items-center justify-center rounded-lg bg-[hsl(var(--selise-blue))]/10">
                            <IconComponent className="size-5 text-[hsl(var(--selise-blue))]" />
                          </div>
                          <div>
                            <p className="font-medium text-[hsl(var(--fg))]">
                              {template.title}
                            </p>
                            <p className="text-sm text-[hsl(var(--globe-grey))] line-clamp-1 max-w-xs">
                              {template.description}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <code className="text-sm bg-[hsl(var(--muted))] px-2 py-1 rounded text-[hsl(var(--fg))]">
                          {template.slug}
                        </code>
                      </td>
                      <td className="px-4 py-4">
                        <Badge
                          variant={template.available ? "default" : "secondary"}
                          className={
                            template.available
                              ? "bg-[hsl(var(--lime-green))] text-white hover:bg-[hsl(var(--lime-green))]/90"
                              : ""
                          }
                        >
                          {template.available ? "Available" : "Coming Soon"}
                        </Badge>
                      </td>
                      <td className="px-4 py-4">
                        {template.popular && (
                          <Badge
                            variant="outline"
                            className="border-[hsl(var(--selise-blue))] text-[hsl(var(--selise-blue))]"
                          >
                            Popular
                          </Badge>
                        )}
                      </td>
                      <td className="px-4 py-4 text-sm text-[hsl(var(--globe-grey))]">
                        {new Date(template.updatedAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-end gap-1">
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="ghost" size="icon-sm">
                                <MoreHorizontal className="size-4" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent
                              align="end"
                              className="w-44 p-1"
                            >
                              <Button
                                variant="ghost"
                                size="sm"
                                className="w-full justify-start gap-2"
                                asChild
                              >
                                <Link href={`/${locale}/admin/templates/${template.id}/edit`}>
                                  <Pencil className="size-4" />
                                  Edit Details
                                </Link>
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="w-full justify-start gap-2"
                                asChild
                              >
                                <Link href={`/${locale}/admin/templates/${template.id}/builder`}>
                                  <Settings2 className="size-4" />
                                  Form Builder
                                </Link>
                              </Button>
                              <div className="h-px bg-[hsl(var(--border))] my-1" />
                              <Button
                                variant="ghost"
                                size="sm"
                                className="w-full justify-start gap-2 text-[hsl(var(--destructive))] hover:text-[hsl(var(--destructive))] hover:bg-[hsl(var(--destructive))]/10"
                                onClick={() => onDelete(template)}
                              >
                                <Trash2 className="size-4" />
                                Delete
                              </Button>
                            </PopoverContent>
                          </Popover>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}


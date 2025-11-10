import { FileText, Lock, Shield, Sparkles, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type TemplateMeta = {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  available: boolean;
  href: string;
  popular?: boolean;
};

export const templates: TemplateMeta[] = [
  {
    id: "employment-agreement",
    title: "Employment Agreement",
    description: "Comprehensive employment contracts with customizable terms, salary, benefits, and termination clauses.",
    icon: FileText,
    available: true,
    href: "/templates/employment-agreement/generate",
    popular: true
  },
  {
    id: "founders-agreement",
    title: "Founders' Agreement",
    description: "Define equity splits, roles, responsibilities, and decision-making processes for your startup.",
    icon: Users,
    available: false,
    href: "#"
  },
  {
    id: "nda",
    title: "Non-Disclosure Agreement",
    description: "Protect confidential information with bilateral or unilateral NDA templates.",
    icon: Lock,
    available: false,
    href: "#"
  },
  {
    id: "dpa",
    title: "Data Processing Agreement",
    description: "GDPR-compliant DPA templates for processor-controller relationships.",
    icon: Shield,
    available: false,
    href: "#"
  },
  {
    id: "ip-assignment",
    title: "IP Assignment Agreement",
    description: "Transfer intellectual property rights with clear terms and comprehensive coverage.",
    icon: Sparkles,
    available: false,
    href: "#"
  }
];

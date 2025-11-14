'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, User, Briefcase, Send, Loader2 } from 'lucide-react';

interface SignatureDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employeeName: string;
  companyName: string;
  onSubmit: (data: SignatureFormData) => Promise<void>;
  isSubmitting?: boolean;
}

export interface SignatureFormData {
  companyRepresentative: {
    name: string;
    email: string;
    title: string;
  };
  employee: {
    email: string;
  };
}

export function SignatureDialog({
  open,
  onOpenChange,
  employeeName,
  companyName,
  onSubmit,
  isSubmitting: externalIsSubmitting,
}: SignatureDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const actualIsSubmitting = externalIsSubmitting ?? isSubmitting;
  const [formData, setFormData] = useState<SignatureFormData>({
    companyRepresentative: {
      name: '',
      email: '',
      title: '',
    },
    employee: {
      email: '',
    },
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Company representative validation
    if (!formData.companyRepresentative.name.trim()) {
      newErrors.companyRepName = 'Company representative name is required';
    }
    if (!formData.companyRepresentative.email.trim()) {
      newErrors.companyRepEmail = 'Company representative email is required';
    } else if (!validateEmail(formData.companyRepresentative.email)) {
      newErrors.companyRepEmail = 'Please enter a valid email address';
    }
    if (!formData.companyRepresentative.title.trim()) {
      newErrors.companyRepTitle = 'Job title is required';
    }

    // Employee validation
    if (!formData.employee.email.trim()) {
      newErrors.employeeEmail = 'Employee email is required';
    } else if (!validateEmail(formData.employee.email)) {
      newErrors.employeeEmail = 'Please enter a valid email address';
    }

    // Check if both emails are the same
    if (
      formData.companyRepresentative.email.trim().toLowerCase() ===
      formData.employee.email.trim().toLowerCase()
    ) {
      newErrors.employeeEmail = 'Employee and company representative emails must be different';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      // Reset form on success
      setFormData({
        companyRepresentative: { name: '', email: '', title: '' },
        employee: { email: '' },
      });
      setErrors({});
    } catch (error) {
      console.error('Error submitting signature request:', error);
      // Keep dialog open on error so user can retry
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateField = (
    section: 'companyRepresentative' | 'employee',
    field: string,
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
    // Clear error for this field when user starts typing
    const errorKey =
      section === 'companyRepresentative'
        ? `companyRep${field.charAt(0).toUpperCase() + field.slice(1)}`
        : `employee${field.charAt(0).toUpperCase() + field.slice(1)}`;
    if (errors[errorKey]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[errorKey];
        return newErrors;
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading text-2xl font-bold text-[hsl(var(--fg))]">
            Send via SELISE Signature
          </DialogTitle>
          <DialogDescription className="font-body text-base text-[hsl(var(--brand-muted))] leading-relaxed">
            Provide the email addresses for both parties who will sign this employment agreement.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          {/* Company Representative Section */}
          <div className="space-y-4 p-6 bg-[hsl(var(--brand-surface))] rounded-xl border-2 border-[hsl(var(--brand-border))]">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-gradient-to-br from-[hsl(var(--selise-blue))] to-[hsl(var(--sky-blue))] rounded-xl flex items-center justify-center shadow-sm">
                <Briefcase className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-heading text-lg font-bold text-[hsl(var(--fg))]">
                Company Representative
              </h3>
            </div>
            <p className="font-body text-sm text-[hsl(var(--brand-muted))] leading-relaxed">
              Person signing on behalf of <strong className="font-semibold text-[hsl(var(--fg))]">{companyName}</strong>
            </p>

            {/* Company Rep Name */}
            <div className="space-y-2">
              <Label htmlFor="companyRepName" className="font-body">
                Full Name <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(var(--brand-muted))]" />
                <Input
                  id="companyRepName"
                  type="text"
                  placeholder="e.g., John Smith"
                  className={`pl-10 ${errors.companyRepName ? 'border-destructive' : ''}`}
                  value={formData.companyRepresentative.name}
                  onChange={(e) =>
                    updateField('companyRepresentative', 'name', e.target.value)
                  }
                  disabled={actualIsSubmitting}
                  aria-invalid={!!errors.companyRepName}
                />
              </div>
              {errors.companyRepName && (
                <p className="font-body text-sm font-medium text-destructive flex items-center gap-2">
                  ⚠️ {errors.companyRepName}
                </p>
              )}
            </div>

            {/* Company Rep Email */}
            <div className="space-y-2">
              <Label htmlFor="companyRepEmail" className="font-body">
                Email Address <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(var(--brand-muted))]" />
                <Input
                  id="companyRepEmail"
                  type="email"
                  placeholder="john.smith@company.com"
                  className={`pl-10 ${errors.companyRepEmail ? 'border-destructive' : ''}`}
                  value={formData.companyRepresentative.email}
                  onChange={(e) =>
                    updateField('companyRepresentative', 'email', e.target.value)
                  }
                  disabled={actualIsSubmitting}
                  aria-invalid={!!errors.companyRepEmail}
                />
              </div>
              {errors.companyRepEmail && (
                <p className="font-body text-sm font-medium text-destructive flex items-center gap-2">
                  ⚠️ {errors.companyRepEmail}
                </p>
              )}
            </div>

            {/* Company Rep Title */}
            <div className="space-y-2">
              <Label htmlFor="companyRepTitle" className="font-body">
                Job Title <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(var(--brand-muted))]" />
                <Input
                  id="companyRepTitle"
                  type="text"
                  placeholder="e.g., CEO, HR Manager"
                  className={`pl-10 ${errors.companyRepTitle ? 'border-destructive' : ''}`}
                  value={formData.companyRepresentative.title}
                  onChange={(e) =>
                    updateField('companyRepresentative', 'title', e.target.value)
                  }
                  disabled={actualIsSubmitting}
                  aria-invalid={!!errors.companyRepTitle}
                />
              </div>
              {errors.companyRepTitle && (
                <p className="font-body text-sm font-medium text-destructive flex items-center gap-2">
                  ⚠️ {errors.companyRepTitle}
                </p>
              )}
            </div>
          </div>

          {/* Employee Section */}
          <div className="space-y-4 p-6 bg-[hsl(var(--brand-surface))] rounded-xl border-2 border-[hsl(var(--brand-border))]">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-[hsl(var(--brand-primary))] rounded-xl flex items-center justify-center shadow-sm">
                <User className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-heading text-lg font-bold text-[hsl(var(--fg))]">Employee</h3>
            </div>
            <p className="font-body text-sm text-[hsl(var(--brand-muted))] leading-relaxed">
              <strong className="font-semibold text-[hsl(var(--fg))]">{employeeName}</strong> will receive the document for signature
            </p>

            {/* Employee Email */}
            <div className="space-y-2">
              <Label htmlFor="employeeEmail" className="font-body">
                Email Address <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(var(--brand-muted))]" />
                <Input
                  id="employeeEmail"
                  type="email"
                  placeholder="employee@email.com"
                  className={`pl-10 ${errors.employeeEmail ? 'border-destructive' : ''}`}
                  value={formData.employee.email}
                  onChange={(e) => updateField('employee', 'email', e.target.value)}
                  disabled={actualIsSubmitting}
                  aria-invalid={!!errors.employeeEmail}
                />
              </div>
              {errors.employeeEmail && (
                <p className="font-body text-sm font-medium text-destructive flex items-center gap-2">
                  ⚠️ {errors.employeeEmail}
                </p>
              )}
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-[hsl(var(--brand-surface))] border-2 border-[hsl(var(--brand-border))] rounded-xl p-4">
            <p className="font-body text-sm text-[hsl(var(--brand-muted))] leading-relaxed flex items-start gap-3">
              <span className="text-xl shrink-0">📧</span>
              <span>Both parties will receive an email with a secure link to review and sign the
              document electronically.</span>
            </p>
          </div>

          <DialogFooter className="gap-3 sm:gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={actualIsSubmitting}
              size="lg"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={actualIsSubmitting}
              size="lg"
            >
              {actualIsSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Preparing...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5 mr-2" />
                  Prepare Document
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

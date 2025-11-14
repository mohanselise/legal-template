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
}: SignatureDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
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
      <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-[hsl(var(--selise-blue))]">
            Send via SELISE Signature
          </DialogTitle>
          <DialogDescription className="text-base pt-2">
            Provide the email addresses for both parties who will sign this employment agreement.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          {/* Company Representative Section */}
          <div className="space-y-4 p-4 bg-[hsl(var(--selise-blue))]/5 dark:bg-[hsl(var(--selise-blue))]/10 rounded-lg border border-[hsl(var(--selise-blue))]/20">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-[hsl(var(--selise-blue))] rounded-lg flex items-center justify-center">
                <Briefcase className="w-4 h-4 text-white" />
              </div>
              <h3 className="font-semibold text-[hsl(var(--fg))]">
                Company Representative
              </h3>
            </div>
            <p className="text-sm text-[hsl(var(--fg))]/70 mb-3">
              Person signing on behalf of <strong>{companyName}</strong>
            </p>

            {/* Company Rep Name */}
            <div className="space-y-2">
              <Label htmlFor="companyRepName" className="text-sm font-medium">
                Full Name <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(var(--fg))]/40" />
                <Input
                  id="companyRepName"
                  type="text"
                  placeholder="e.g., John Smith"
                  className={`pl-10 ${errors.companyRepName ? 'border-red-500' : ''}`}
                  value={formData.companyRepresentative.name}
                  onChange={(e) =>
                    updateField('companyRepresentative', 'name', e.target.value)
                  }
                  disabled={isSubmitting}
                />
              </div>
              {errors.companyRepName && (
                <p className="text-sm text-red-500">{errors.companyRepName}</p>
              )}
            </div>

            {/* Company Rep Email */}
            <div className="space-y-2">
              <Label htmlFor="companyRepEmail" className="text-sm font-medium">
                Email Address <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(var(--fg))]/40" />
                <Input
                  id="companyRepEmail"
                  type="email"
                  placeholder="john.smith@company.com"
                  className={`pl-10 ${errors.companyRepEmail ? 'border-red-500' : ''}`}
                  value={formData.companyRepresentative.email}
                  onChange={(e) =>
                    updateField('companyRepresentative', 'email', e.target.value)
                  }
                  disabled={isSubmitting}
                />
              </div>
              {errors.companyRepEmail && (
                <p className="text-sm text-red-500">{errors.companyRepEmail}</p>
              )}
            </div>

            {/* Company Rep Title */}
            <div className="space-y-2">
              <Label htmlFor="companyRepTitle" className="text-sm font-medium">
                Job Title <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(var(--fg))]/40" />
                <Input
                  id="companyRepTitle"
                  type="text"
                  placeholder="e.g., CEO, HR Manager"
                  className={`pl-10 ${errors.companyRepTitle ? 'border-red-500' : ''}`}
                  value={formData.companyRepresentative.title}
                  onChange={(e) =>
                    updateField('companyRepresentative', 'title', e.target.value)
                  }
                  disabled={isSubmitting}
                />
              </div>
              {errors.companyRepTitle && (
                <p className="text-sm text-red-500">{errors.companyRepTitle}</p>
              )}
            </div>
          </div>

          {/* Employee Section */}
          <div className="space-y-4 p-4 bg-[hsl(var(--poly-green))]/5 dark:bg-[hsl(var(--poly-green))]/10 rounded-lg border border-[hsl(var(--poly-green))]/20">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-[hsl(var(--poly-green))] rounded-lg flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              <h3 className="font-semibold text-[hsl(var(--fg))]">Employee</h3>
            </div>
            <p className="text-sm text-[hsl(var(--fg))]/70 mb-3">
              <strong>{employeeName}</strong> will receive the document for signature
            </p>

            {/* Employee Email */}
            <div className="space-y-2">
              <Label htmlFor="employeeEmail" className="text-sm font-medium">
                Email Address <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(var(--fg))]/40" />
                <Input
                  id="employeeEmail"
                  type="email"
                  placeholder="employee@email.com"
                  className={`pl-10 ${errors.employeeEmail ? 'border-red-500' : ''}`}
                  value={formData.employee.email}
                  onChange={(e) => updateField('employee', 'email', e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
              {errors.employeeEmail && (
                <p className="text-sm text-red-500">{errors.employeeEmail}</p>
              )}
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <p className="text-sm text-blue-900 dark:text-blue-200">
              📧 Both parties will receive an email with a secure link to review and sign the
              document electronically.
            </p>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-gradient-to-r from-[hsl(var(--gradient-mid-from))] to-[hsl(var(--gradient-mid-to))] text-white hover:from-[hsl(var(--selise-blue))] hover:to-[hsl(var(--gradient-dark-to))]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send for Signature
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

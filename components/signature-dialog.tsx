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
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-2 border-white/20 dark:border-gray-700/50 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-3xl font-bold text-white bg-linear-to-r from-[hsl(var(--selise-blue))] to-[hsl(var(--sky-blue))] -mx-6 -mt-6 px-6 py-5 rounded-t-xl mb-2 shadow-lg">
            Send via SELISE Signature
          </DialogTitle>
          <DialogDescription className="text-lg pt-3 text-gray-800 dark:text-gray-100 leading-relaxed font-medium">
            Provide the email addresses for both parties who will sign this employment agreement.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-7 py-6">
          {/* Company Representative Section */}
          <div className="space-y-5 p-6 bg-linear-to-br from-blue-50/80 to-blue-100/60 dark:from-blue-950/40 dark:to-blue-900/30 backdrop-blur-sm rounded-xl border-2 border-blue-300/60 dark:border-blue-600/40 shadow-lg">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 bg-linear-to-br from-[hsl(var(--selise-blue))] to-[hsl(var(--sky-blue))] rounded-xl flex items-center justify-center shadow-md">
                <Briefcase className="w-5 h-5 text-white drop-shadow-sm" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white drop-shadow-sm">
                Company Representative
              </h3>
            </div>
            <p className="text-base text-gray-800 dark:text-gray-100 mb-4 leading-relaxed font-medium">
              Person signing on behalf of <strong className="font-bold text-gray-900 dark:text-white">{companyName}</strong>
            </p>

            {/* Company Rep Name */}
            <div className="space-y-3">
              <Label htmlFor="companyRepName" className="text-gray-900 dark:text-white drop-shadow-sm">
                Full Name <span className="text-red-600 dark:text-red-400 font-bold">*</span>
              </Label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600 dark:text-gray-300" />
                <Input
                  id="companyRepName"
                  type="text"
                  placeholder="e.g., John Smith"
                  className={`pl-12 text-base bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 border-gray-300 dark:border-gray-600 shadow-sm ${errors.companyRepName ? 'border-red-600 dark:border-red-500 ring-red-600/20 dark:ring-red-500/30' : ''}`}
                  value={formData.companyRepresentative.name}
                  onChange={(e) =>
                    updateField('companyRepresentative', 'name', e.target.value)
                  }
                  disabled={actualIsSubmitting}
                />
              </div>
              {errors.companyRepName && (
                <p className="text-base font-semibold text-red-700 dark:text-red-400 flex items-center gap-2 drop-shadow-sm">
                  <span className="text-lg">⚠️</span> {errors.companyRepName}
                </p>
              )}
            </div>

            {/* Company Rep Email */}
            <div className="space-y-3">
              <Label htmlFor="companyRepEmail" className="text-gray-900 dark:text-white drop-shadow-sm">
                Email Address <span className="text-red-600 dark:text-red-400 font-bold">*</span>
              </Label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600 dark:text-gray-300" />
                <Input
                  id="companyRepEmail"
                  type="email"
                  placeholder="john.smith@company.com"
                  className={`pl-12 text-base bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 border-gray-300 dark:border-gray-600 shadow-sm ${errors.companyRepEmail ? 'border-red-600 dark:border-red-500 ring-red-600/20 dark:ring-red-500/30' : ''}`}
                  value={formData.companyRepresentative.email}
                  onChange={(e) =>
                    updateField('companyRepresentative', 'email', e.target.value)
                  }
                  disabled={actualIsSubmitting}
                />
              </div>
              {errors.companyRepEmail && (
                <p className="text-base font-semibold text-red-700 dark:text-red-400 flex items-center gap-2 drop-shadow-sm">
                  <span className="text-lg">⚠️</span> {errors.companyRepEmail}
                </p>
              )}
            </div>

            {/* Company Rep Title */}
            <div className="space-y-3">
              <Label htmlFor="companyRepTitle" className="text-gray-900 dark:text-white drop-shadow-sm">
                Job Title <span className="text-red-600 dark:text-red-400 font-bold">*</span>
              </Label>
              <div className="relative">
                <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600 dark:text-gray-300" />
                <Input
                  id="companyRepTitle"
                  type="text"
                  placeholder="e.g., CEO, HR Manager"
                  className={`pl-12 text-base bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 border-gray-300 dark:border-gray-600 shadow-sm ${errors.companyRepTitle ? 'border-red-600 dark:border-red-500 ring-red-600/20 dark:ring-red-500/30' : ''}`}
                  value={formData.companyRepresentative.title}
                  onChange={(e) =>
                    updateField('companyRepresentative', 'title', e.target.value)
                  }
                  disabled={actualIsSubmitting}
                />
              </div>
              {errors.companyRepTitle && (
                <p className="text-base font-semibold text-red-700 dark:text-red-400 flex items-center gap-2 drop-shadow-sm">
                  <span className="text-lg">⚠️</span> {errors.companyRepTitle}
                </p>
              )}
            </div>
          </div>

          {/* Employee Section */}
          <div className="space-y-5 p-6 bg-linear-to-br from-green-50/80 to-emerald-100/60 dark:from-green-950/40 dark:to-emerald-900/30 backdrop-blur-sm rounded-xl border-2 border-green-300/60 dark:border-green-600/40 shadow-lg">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 bg-linear-to-br from-green-600 to-emerald-600 dark:from-green-500 dark:to-emerald-500 rounded-xl flex items-center justify-center shadow-md">
                <User className="w-5 h-5 text-white drop-shadow-sm" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white drop-shadow-sm">Employee</h3>
            </div>
            <p className="text-base text-gray-800 dark:text-gray-100 mb-4 leading-relaxed font-medium">
              <strong className="font-bold text-gray-900 dark:text-white">{employeeName}</strong> will receive the document for signature
            </p>

            {/* Employee Email */}
            <div className="space-y-3">
              <Label htmlFor="employeeEmail" className="text-gray-900 dark:text-white drop-shadow-sm">
                Email Address <span className="text-red-600 dark:text-red-400 font-bold">*</span>
              </Label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600 dark:text-gray-300" />
                <Input
                  id="employeeEmail"
                  type="email"
                  placeholder="employee@email.com"
                  className={`pl-12 text-base bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 border-gray-300 dark:border-gray-600 shadow-sm ${errors.employeeEmail ? 'border-red-600 dark:border-red-500 ring-red-600/20 dark:ring-red-500/30' : ''}`}
                  value={formData.employee.email}
                  onChange={(e) => updateField('employee', 'email', e.target.value)}
                  disabled={actualIsSubmitting}
                />
              </div>
              {errors.employeeEmail && (
                <p className="text-base font-semibold text-red-700 dark:text-red-400 flex items-center gap-2 drop-shadow-sm">
                  <span className="text-lg">⚠️</span> {errors.employeeEmail}
                </p>
              )}
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-linear-to-br from-blue-100/80 to-sky-100/70 dark:from-blue-900/50 dark:to-sky-900/40 backdrop-blur-sm border-2 border-blue-400/60 dark:border-blue-500/50 rounded-xl p-5 shadow-lg">
            <p className="text-base font-semibold text-blue-900 dark:text-blue-50 leading-relaxed flex items-start gap-3 drop-shadow-sm">
              <span className="text-2xl shrink-0 mt-0.5">📧</span>
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
              className="text-base font-semibold h-12 px-6 border-2"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={actualIsSubmitting}
              className="bg-linear-to-r from-[hsl(var(--gradient-mid-from))] to-[hsl(var(--gradient-mid-to))] text-white hover:from-[hsl(var(--selise-blue))] hover:to-[hsl(var(--gradient-dark-to))] text-base font-bold h-12 px-8 shadow-lg hover:shadow-xl transition-all"
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

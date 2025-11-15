'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Briefcase, Mail, User, ArrowRight } from 'lucide-react';

interface EmployerInfo {
  signerName: string;
  signerEmail: string;
  signerTitle: string;
}

interface EmployerInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (info: EmployerInfo) => void;
  companyName: string;
  employeeName: string;
  employeeEmail: string;
}

export function EmployerInfoModal({
  isOpen,
  onClose,
  onSubmit,
  companyName,
  employeeName,
  employeeEmail,
}: EmployerInfoModalProps) {
  const [signerName, setSignerName] = useState('');
  const [signerEmail, setSignerEmail] = useState('');
  const [signerTitle, setSignerTitle] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newErrors: Record<string, string> = {};

    if (!signerName.trim()) {
      newErrors.signerName = 'Name is required';
    }

    if (!signerEmail.trim()) {
      newErrors.signerEmail = 'Email is required';
    } else if (!validateEmail(signerEmail)) {
      newErrors.signerEmail = 'Invalid email address';
    }

    if (!signerTitle.trim()) {
      newErrors.signerTitle = 'Title is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSubmit({
      signerName,
      signerEmail,
      signerTitle,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <Briefcase className="w-6 h-6 text-blue-600" />
            Employer Signing Information
          </DialogTitle>
          <DialogDescription className="text-base pt-2">
            Who will sign this employment agreement on behalf of <strong>{companyName}</strong>?
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 pt-4">
          {/* Employer Signer Info */}
          <div className="space-y-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2 text-sm font-semibold text-blue-900">
              <Briefcase className="w-4 h-4" />
              Company Representative
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="signerName" className="text-sm font-semibold">
                  Full Name <span className="text-red-500">*</span>
                </Label>
                <div className="relative mt-1.5">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="signerName"
                    type="text"
                    placeholder="e.g., John Smith"
                    value={signerName}
                    onChange={(e) => {
                      setSignerName(e.target.value);
                      setErrors({ ...errors, signerName: '' });
                    }}
                    className={`pl-10 ${errors.signerName ? 'border-red-500' : ''}`}
                  />
                </div>
                {errors.signerName && (
                  <p className="text-xs text-red-600 mt-1">{errors.signerName}</p>
                )}
              </div>

              <div>
                <Label htmlFor="signerEmail" className="text-sm font-semibold">
                  Email Address <span className="text-red-500">*</span>
                </Label>
                <div className="relative mt-1.5">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="signerEmail"
                    type="email"
                    placeholder="e.g., john.smith@company.com"
                    value={signerEmail}
                    onChange={(e) => {
                      setSignerEmail(e.target.value);
                      setErrors({ ...errors, signerEmail: '' });
                    }}
                    className={`pl-10 ${errors.signerEmail ? 'border-red-500' : ''}`}
                  />
                </div>
                {errors.signerEmail && (
                  <p className="text-xs text-red-600 mt-1">{errors.signerEmail}</p>
                )}
              </div>

              <div>
                <Label htmlFor="signerTitle" className="text-sm font-semibold">
                  Job Title <span className="text-red-500">*</span>
                </Label>
                <div className="relative mt-1.5">
                  <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="signerTitle"
                    type="text"
                    placeholder="e.g., CEO, HR Director, etc."
                    value={signerTitle}
                    onChange={(e) => {
                      setSignerTitle(e.target.value);
                      setErrors({ ...errors, signerTitle: '' });
                    }}
                    className={`pl-10 ${errors.signerTitle ? 'border-red-500' : ''}`}
                  />
                </div>
                {errors.signerTitle && (
                  <p className="text-xs text-red-600 mt-1">{errors.signerTitle}</p>
                )}
              </div>
            </div>
          </div>

          {/* Employee Info (Read-only) */}
          <div className="space-y-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2 text-sm font-semibold text-green-900">
              <User className="w-4 h-4" />
              Employee (will receive invitation)
            </div>

            <div className="space-y-3">
              <div>
                <Label className="text-sm font-semibold text-gray-700">Full Name</Label>
                <div className="mt-1.5 px-3 py-2 bg-white border border-green-300 rounded-md text-sm text-gray-900">
                  {employeeName}
                </div>
              </div>

              <div>
                <Label className="text-sm font-semibold text-gray-700">Email Address</Label>
                <div className="mt-1.5 px-3 py-2 bg-white border border-green-300 rounded-md text-sm text-gray-900">
                  {employeeEmail}
                </div>
              </div>
            </div>
          </div>

          {/* Info Box */}
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm text-amber-900">
              <strong className="font-semibold">Note:</strong> Signature fields will be automatically placed in the appropriate locations on the PDF. You can drag and adjust them if needed.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            >
              Continue
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

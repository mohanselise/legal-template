'use client';

import { Download, Send, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ActionButtonsProps {
  onDownload?: () => void;
  onEmail?: () => void;
  onEdit?: () => void;
}

export function ActionButtons({ onDownload, onEmail, onEdit }: ActionButtonsProps) {
  return (
    <div className="flex items-center gap-3">
      {onEdit && (
        <Button variant="outline" onClick={onEdit} className="flex items-center gap-2">
          <Edit className="w-4 h-4" />
          Edit
        </Button>
      )}
      {onDownload && (
        <Button variant="outline" onClick={onDownload} className="flex items-center gap-2">
          <Download className="w-4 h-4" />
          Download PDF
        </Button>
      )}
      {onEmail && (
        <Button onClick={onEmail} className="flex items-center gap-2">
          <Send className="w-4 h-4" />
          Send for signature
        </Button>
      )}
    </div>
  );
}

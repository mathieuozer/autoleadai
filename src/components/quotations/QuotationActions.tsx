'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

interface Quotation {
  id: string;
  quotationNumber: string;
  status: string;
  totalAmount: number;
  validUntil: string;
  issuedAt: string;
  sentAt?: string | null;
  pdfUrl?: string | null;
  dmsQuotationId?: string | null;
  dmsSyncedAt?: string | null;
}

interface QuotationActionsProps {
  quotation: Quotation;
  onIssue: () => void;
  onSend: (channel: 'email' | 'whatsapp') => void;
  onSyncDms: () => void;
  onDownloadPdf?: () => void;
  isIssuing?: boolean;
  isSending?: boolean;
  isSyncing?: boolean;
}

export function QuotationActions({
  quotation,
  onIssue,
  onSend,
  onSyncDms,
  onDownloadPdf,
  isIssuing,
  isSending,
  isSyncing,
}: QuotationActionsProps) {
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isExpired = new Date(quotation.validUntil) < new Date();
  const canIssue = quotation.status === 'DRAFT' && !isExpired;
  const canSend = ['ISSUED', 'SENT'].includes(quotation.status) && !isExpired;
  const canSync = ['ISSUED', 'SENT', 'ACCEPTED'].includes(quotation.status) && !quotation.dmsQuotationId;

  const getStatusInfo = () => {
    switch (quotation.status) {
      case 'DRAFT':
        return { icon: '📝', text: 'Ready to issue' };
      case 'ISSUED':
        return { icon: '✅', text: 'Issued, ready to send' };
      case 'SENT':
        return { icon: '📤', text: `Sent on ${formatDate(quotation.sentAt!)}` };
      case 'ACCEPTED':
        return { icon: '🎉', text: 'Accepted by customer' };
      case 'EXPIRED':
        return { icon: '⏰', text: 'Quotation expired' };
      case 'CANCELLED':
        return { icon: '❌', text: 'Cancelled' };
      default:
        return { icon: '📄', text: quotation.status };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Quotation Actions</span>
          <span className="text-sm font-mono text-gray-500">{quotation.quotationNumber}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status */}
        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
          <span className="text-2xl">{statusInfo.icon}</span>
          <div>
            <Badge
              variant={
                quotation.status === 'ACCEPTED'
                  ? 'success'
                  : quotation.status === 'EXPIRED' || quotation.status === 'CANCELLED'
                  ? 'danger'
                  : 'info'
              }
            >
              {quotation.status}
            </Badge>
            <p className="text-sm text-gray-600 mt-1">{statusInfo.text}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          {/* Issue */}
          {canIssue && (
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium text-gray-900">Issue Quotation</p>
                <p className="text-sm text-gray-500">Finalize and prepare for sending</p>
              </div>
              <Button onClick={onIssue} isLoading={isIssuing}>
                Issue
              </Button>
            </div>
          )}

          {/* Send */}
          {canSend && (
            <div className="p-3 border rounded-lg space-y-3">
              <div>
                <p className="font-medium text-gray-900">Send to Customer</p>
                <p className="text-sm text-gray-500">Send via email or WhatsApp</p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => onSend('email')}
                  isLoading={isSending}
                  className="flex-1"
                >
                  <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Email
                </Button>
                <Button
                  variant="outline"
                  onClick={() => onSend('whatsapp')}
                  isLoading={isSending}
                  className="flex-1"
                >
                  <svg className="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                  </svg>
                  WhatsApp
                </Button>
              </div>
            </div>
          )}

          {/* DMS Sync */}
          {canSync && (
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium text-gray-900">Sync to DMS</p>
                <p className="text-sm text-gray-500">Send to dealer management system</p>
              </div>
              <Button variant="secondary" onClick={onSyncDms} isLoading={isSyncing}>
                Sync
              </Button>
            </div>
          )}

          {/* DMS Synced Status */}
          {quotation.dmsQuotationId && (
            <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg border border-green-200">
              <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-sm font-medium text-green-800">Synced to DMS</p>
                <p className="text-xs text-green-600">
                  ID: {quotation.dmsQuotationId}
                  {quotation.dmsSyncedAt && ` • ${formatDate(quotation.dmsSyncedAt)}`}
                </p>
              </div>
            </div>
          )}

          {/* Download PDF */}
          {quotation.pdfUrl && onDownloadPdf && (
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium text-gray-900">Download PDF</p>
                <p className="text-sm text-gray-500">Get a copy of the quotation</p>
              </div>
              <Button variant="outline" onClick={onDownloadPdf}>
                <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Download
              </Button>
            </div>
          )}

          {/* Expired Warning */}
          {isExpired && (
            <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
              <p className="text-sm text-amber-800">
                This quotation has expired. Please create a new quotation if needed.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

'use client';

import { useState, useCallback } from 'react';
import type { DocumentData } from './use-customer-order';

interface UseDocumentsReturn {
  isUploading: boolean;
  uploadError: string | null;
  uploadDocument: (data: {
    orderId: string;
    type: string;
    name: string;
    fileUrl?: string;
    fileName?: string;
    fileSize?: number;
    mimeType?: string;
  }) => Promise<DocumentData | null>;
  downloadDocument: (documentId: string) => void;
  deleteDocument: (documentId: string) => Promise<boolean>;
  getDocumentDetails: (documentId: string) => Promise<DocumentData | null>;
}

export function useDocuments(): UseDocumentsReturn {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const uploadDocument = useCallback(async (data: {
    orderId: string;
    type: string;
    name: string;
    fileUrl?: string;
    fileName?: string;
    fileSize?: number;
    mimeType?: string;
  }): Promise<DocumentData | null> => {
    setIsUploading(true);
    setUploadError(null);

    try {
      const response = await fetch('/api/portal/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to upload document');
      }

      return result.data as DocumentData;
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Failed to upload document');
      return null;
    } finally {
      setIsUploading(false);
    }
  }, []);

  const downloadDocument = useCallback((documentId: string) => {
    // Open document in new tab for download
    window.open(`/api/portal/documents/${documentId}?download=true`, '_blank');
  }, []);

  const deleteDocument = useCallback(async (documentId: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/portal/documents/${documentId}`, {
        method: 'DELETE',
      });
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to delete document');
      }

      return true;
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Failed to delete document');
      return false;
    }
  }, []);

  const getDocumentDetails = useCallback(async (documentId: string): Promise<DocumentData | null> => {
    try {
      const response = await fetch(`/api/portal/documents/${documentId}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to fetch document');
      }

      return result.data as DocumentData;
    } catch (err) {
      console.error('Error fetching document:', err);
      return null;
    }
  }, []);

  return {
    isUploading,
    uploadError,
    uploadDocument,
    downloadDocument,
    deleteDocument,
    getDocumentDetails,
  };
}

// Utility to convert document status from DB format to display format
export function formatDocumentStatus(status: string): 'pending' | 'approved' | 'under-review' | 'rejected' {
  switch (status) {
    case 'APPROVED':
      return 'approved';
    case 'UNDER_REVIEW':
      return 'under-review';
    case 'REJECTED':
      return 'rejected';
    case 'PENDING':
    case 'UPLOADED':
    default:
      return 'pending';
  }
}

// Utility to format document type for display
export function formatDocumentType(type: string): string {
  switch (type) {
    case 'ID_PROOF':
      return 'ID Proof';
    case 'ADDRESS_PROOF':
      return 'Address Proof';
    case 'INCOME_CERTIFICATE':
      return 'Income Certificate';
    case 'INSURANCE':
      return 'Insurance Document';
    case 'BANK_STATEMENT':
      return 'Bank Statement';
    default:
      return type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  }
}

// Utility to format file size
export function formatFileSize(bytes: number | null): string {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

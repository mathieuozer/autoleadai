'use client';

import { Badge, BadgeVariant } from '@/components/ui/Badge';

export interface DocumentItem {
  id: string;
  name: string;
  type: string;
  status: 'approved' | 'pending' | 'under-review' | 'rejected';
  uploadDate?: string;
  size?: string;
}

interface DocumentCardProps {
  document: DocumentItem;
  onDownload?: (id: string) => void;
  onUpload?: (id: string) => void;
  className?: string;
}

const statusLabels: Record<DocumentItem['status'], string> = {
  approved: 'Approved',
  pending: 'Pending',
  'under-review': 'Under Review',
  rejected: 'Rejected',
};

const fileTypeIcons: Record<string, React.ReactNode> = {
  pdf: (
    <svg className="w-6 h-6 text-red-500" fill="currentColor" viewBox="0 0 24 24">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zM6 20V4h7v5h5v11H6z" />
      <path d="M8 15.5c0-.28.22-.5.5-.5h1c.28 0 .5.22.5.5v2c0 .28-.22.5-.5.5h-1a.5.5 0 01-.5-.5v-2zM11 14.5c0-.28.22-.5.5-.5h1c.28 0 .5.22.5.5v3c0 .28-.22.5-.5.5h-1a.5.5 0 01-.5-.5v-3zM14 15.5c0-.28.22-.5.5-.5h1c.28 0 .5.22.5.5v2c0 .28-.22.5-.5.5h-1a.5.5 0 01-.5-.5v-2z" />
    </svg>
  ),
  doc: (
    <svg className="w-6 h-6 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zM6 20V4h7v5h5v11H6z" />
      <path d="M8 12h8v1H8zm0 2h8v1H8zm0 2h5v1H8z" />
    </svg>
  ),
  image: (
    <svg className="w-6 h-6 text-green-500" fill="currentColor" viewBox="0 0 24 24">
      <path d="M19 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2zm0 16H5V5h14v14z" />
      <path d="M10 12l-2 3h8l-3-4-2 2.5z" />
      <circle cx="8.5" cy="8.5" r="1.5" />
    </svg>
  ),
  default: (
    <svg className="w-6 h-6 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zM6 20V4h7v5h5v11H6z" />
    </svg>
  ),
};

function getFileIcon(type: string) {
  const lowerType = type.toLowerCase();
  if (lowerType.includes('pdf')) return fileTypeIcons.pdf;
  if (lowerType.includes('doc') || lowerType.includes('word')) return fileTypeIcons.doc;
  if (lowerType.includes('image') || lowerType.includes('jpg') || lowerType.includes('png')) return fileTypeIcons.image;
  return fileTypeIcons.default;
}

export function DocumentCard({ document, onDownload, onUpload, className = '' }: DocumentCardProps) {
  return (
    <div
      className={`bg-white rounded-xl p-4 border border-gray-100 hover:shadow-md transition-shadow ${className}`}
    >
      <div className="flex items-start gap-4">
        {/* File Icon */}
        <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-gray-50 flex items-center justify-center">
          {getFileIcon(document.type)}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h4 className="font-medium text-gray-900 truncate">{document.name}</h4>
              <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                <span>{document.type}</span>
                {document.size && (
                  <>
                    <span>•</span>
                    <span>{document.size}</span>
                  </>
                )}
              </div>
            </div>
            <Badge variant={document.status as BadgeVariant} size="sm">
              {statusLabels[document.status]}
            </Badge>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 mt-3">
            {document.status !== 'rejected' && onDownload && (
              <button
                onClick={() => onDownload(document.id)}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-[#7c3aed] hover:text-[#6d28d9] transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download
              </button>
            )}
            {(document.status === 'pending' || document.status === 'rejected') && onUpload && (
              <button
                onClick={() => onUpload(document.id)}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                {document.status === 'rejected' ? 'Re-upload' : 'Upload'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

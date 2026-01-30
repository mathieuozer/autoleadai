// Blob Storage Library for Test Drive Documents
// Uses Azure Blob Storage when configured, falls back to local mock storage

const AZURE_STORAGE_CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING || '';
const AZURE_STORAGE_CONTAINER = process.env.AZURE_STORAGE_CONTAINER || 'test-drive-documents';

// Storage types
export type DocumentType = 'license-front' | 'license-back' | 'national-id-front' | 'national-id-back' | 'signature' | 'agreement';

interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

interface DownloadResult {
  success: boolean;
  data?: Buffer;
  contentType?: string;
  error?: string;
}

// Generate a storage path for a document
function getStoragePath(testDriveId: string, documentType: DocumentType, extension: string = 'jpg'): string {
  return `${testDriveId}/${documentType}.${extension}`;
}

// Check if Azure Blob Storage is configured
function isAzureConfigured(): boolean {
  return AZURE_STORAGE_CONNECTION_STRING.length > 0;
}

// Azure Blob Storage implementation
async function uploadToAzure(
  path: string,
  data: Buffer,
  contentType: string
): Promise<UploadResult> {
  try {
    // Dynamic import to avoid issues when Azure SDK is not installed
    const { BlobServiceClient } = await import('@azure/storage-blob');

    const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING);
    const containerClient = blobServiceClient.getContainerClient(AZURE_STORAGE_CONTAINER);

    // Ensure container exists
    await containerClient.createIfNotExists({
      access: 'blob', // Public read access for blobs
    });

    const blockBlobClient = containerClient.getBlockBlobClient(path);

    await blockBlobClient.uploadData(data, {
      blobHTTPHeaders: {
        blobContentType: contentType,
      },
    });

    return {
      success: true,
      url: blockBlobClient.url,
    };
  } catch (error) {
    console.error('Azure blob upload error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed',
    };
  }
}

async function downloadFromAzure(path: string): Promise<DownloadResult> {
  try {
    const { BlobServiceClient } = await import('@azure/storage-blob');

    const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING);
    const containerClient = blobServiceClient.getContainerClient(AZURE_STORAGE_CONTAINER);
    const blockBlobClient = containerClient.getBlockBlobClient(path);

    const downloadResponse = await blockBlobClient.download();

    if (!downloadResponse.readableStreamBody) {
      return {
        success: false,
        error: 'No data returned',
      };
    }

    // Convert stream to buffer
    const chunks: Buffer[] = [];
    for await (const chunk of downloadResponse.readableStreamBody) {
      chunks.push(Buffer.from(chunk));
    }

    return {
      success: true,
      data: Buffer.concat(chunks),
      contentType: downloadResponse.contentType,
    };
  } catch (error) {
    console.error('Azure blob download error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Download failed',
    };
  }
}

async function deleteFromAzure(path: string): Promise<boolean> {
  try {
    const { BlobServiceClient } = await import('@azure/storage-blob');

    const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING);
    const containerClient = blobServiceClient.getContainerClient(AZURE_STORAGE_CONTAINER);
    const blockBlobClient = containerClient.getBlockBlobClient(path);

    await blockBlobClient.delete();
    return true;
  } catch (error) {
    console.error('Azure blob delete error:', error);
    return false;
  }
}

// Mock storage (for development without Azure)
const mockStorage = new Map<string, { data: Buffer; contentType: string }>();

async function uploadToMock(
  path: string,
  data: Buffer,
  contentType: string
): Promise<UploadResult> {
  mockStorage.set(path, { data, contentType });
  return {
    success: true,
    url: `/api/storage/${encodeURIComponent(path)}`,
  };
}

async function downloadFromMock(path: string): Promise<DownloadResult> {
  const item = mockStorage.get(path);
  if (!item) {
    return {
      success: false,
      error: 'Not found',
    };
  }
  return {
    success: true,
    data: item.data,
    contentType: item.contentType,
  };
}

// Public API
export async function uploadDocument(
  testDriveId: string,
  documentType: DocumentType,
  data: Buffer | string,
  contentType: string = 'image/jpeg'
): Promise<UploadResult> {
  // Convert base64 to buffer if needed
  let buffer: Buffer;
  if (typeof data === 'string') {
    // Handle data URL format
    const base64Data = data.replace(/^data:[^;]+;base64,/, '');
    buffer = Buffer.from(base64Data, 'base64');
  } else {
    buffer = data;
  }

  // Determine extension from content type
  const extensions: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'application/pdf': 'pdf',
  };
  const extension = extensions[contentType] || 'bin';

  const path = getStoragePath(testDriveId, documentType, extension);

  if (isAzureConfigured()) {
    return uploadToAzure(path, buffer, contentType);
  }

  return uploadToMock(path, buffer, contentType);
}

export async function downloadDocument(
  testDriveId: string,
  documentType: DocumentType,
  extension: string = 'jpg'
): Promise<DownloadResult> {
  const path = getStoragePath(testDriveId, documentType, extension);

  if (isAzureConfigured()) {
    return downloadFromAzure(path);
  }

  return downloadFromMock(path);
}

export async function deleteDocument(
  testDriveId: string,
  documentType: DocumentType,
  extension: string = 'jpg'
): Promise<boolean> {
  const path = getStoragePath(testDriveId, documentType, extension);

  if (isAzureConfigured()) {
    return deleteFromAzure(path);
  }

  mockStorage.delete(path);
  return true;
}

export async function uploadSignature(
  testDriveId: string,
  signatureData: string
): Promise<UploadResult> {
  return uploadDocument(testDriveId, 'signature', signatureData, 'image/png');
}

export async function uploadAgreementPDF(
  testDriveId: string,
  pdfBuffer: Buffer
): Promise<UploadResult> {
  return uploadDocument(testDriveId, 'agreement', pdfBuffer, 'application/pdf');
}

export async function getDocumentUrl(
  testDriveId: string,
  documentType: DocumentType,
  extension: string = 'jpg'
): Promise<string | null> {
  const path = getStoragePath(testDriveId, documentType, extension);

  if (isAzureConfigured()) {
    try {
      const { BlobServiceClient } = await import('@azure/storage-blob');
      const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING);
      const containerClient = blobServiceClient.getContainerClient(AZURE_STORAGE_CONTAINER);
      const blockBlobClient = containerClient.getBlockBlobClient(path);

      // Check if blob exists
      const exists = await blockBlobClient.exists();
      if (!exists) return null;

      return blockBlobClient.url;
    } catch {
      return null;
    }
  }

  // Mock storage URL
  if (mockStorage.has(path)) {
    return `/api/storage/${encodeURIComponent(path)}`;
  }

  return null;
}

/**
 * Mock E-Signature Provider
 *
 * This provider simulates DocuSign functionality for development and testing.
 * It stores signatures as data URLs and tracks envelope status in memory.
 *
 * Features:
 * - Canvas-based signature capture (client-side)
 * - In-memory envelope storage (or database in production)
 * - Simulated signing flow
 * - Agreement PDF generation (placeholder)
 */

import {
  ESignProvider,
  CreateEnvelopeParams,
  EnvelopeResult,
  EnvelopeStatusResult,
  SignedDocumentResult,
  SigningUrlParams,
  EnvelopeStatus,
} from '../types';

interface MockEnvelope {
  id: string;
  status: EnvelopeStatus;
  documentBase64: string;
  documentName: string;
  signerEmail: string;
  signerName: string;
  signatureData?: string;
  createdAt: Date;
  sentAt?: Date;
  signedAt?: Date;
  completedAt?: Date;
  metadata?: Record<string, string>;
}

// In-memory storage for development
// In production, this would be stored in the database
const envelopeStore = new Map<string, MockEnvelope>();

function generateEnvelopeId(): string {
  return `mock_env_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

export class MockSignatureProvider implements ESignProvider {
  readonly name = 'mock';

  async createEnvelope(params: CreateEnvelopeParams): Promise<EnvelopeResult> {
    const envelopeId = generateEnvelopeId();
    const now = new Date();

    const envelope: MockEnvelope = {
      id: envelopeId,
      status: 'created',
      documentBase64: params.documentBase64,
      documentName: params.documentName,
      signerEmail: params.signerEmail,
      signerName: params.signerName,
      createdAt: now,
      metadata: params.metadata,
    };

    envelopeStore.set(envelopeId, envelope);

    return {
      envelopeId,
      status: 'created',
      createdAt: now,
      expiresAt: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000), // 30 days
    };
  }

  async getEnvelopeStatus(envelopeId: string): Promise<EnvelopeStatusResult> {
    const envelope = envelopeStore.get(envelopeId);

    if (!envelope) {
      throw new Error(`Envelope not found: ${envelopeId}`);
    }

    return {
      envelopeId,
      status: envelope.status,
      signerEmail: envelope.signerEmail,
      signerName: envelope.signerName,
      sentAt: envelope.sentAt,
      signedAt: envelope.signedAt,
      completedAt: envelope.completedAt,
    };
  }

  async getSignedDocument(envelopeId: string): Promise<SignedDocumentResult> {
    const envelope = envelopeStore.get(envelopeId);

    if (!envelope) {
      throw new Error(`Envelope not found: ${envelopeId}`);
    }

    if (envelope.status !== 'completed' && envelope.status !== 'signed') {
      throw new Error(`Document not yet signed. Status: ${envelope.status}`);
    }

    // In a real implementation, this would merge the signature onto the document
    // For now, return the original document
    const content = Buffer.from(envelope.documentBase64, 'base64');

    return {
      content,
      mimeType: 'application/pdf',
      filename: `signed_${envelope.documentName}`,
    };
  }

  async generateSigningUrl(envelopeId: string, params: SigningUrlParams): Promise<string> {
    const envelope = envelopeStore.get(envelopeId);

    if (!envelope) {
      throw new Error(`Envelope not found: ${envelopeId}`);
    }

    // Update status to sent
    envelope.status = 'sent';
    envelope.sentAt = new Date();
    envelopeStore.set(envelopeId, envelope);

    // In the mock implementation, signing happens client-side
    // Return a URL that includes the envelope ID for the frontend to handle
    const returnUrlEncoded = encodeURIComponent(params.returnUrl);
    return `/sign/${envelopeId}?returnUrl=${returnUrlEncoded}`;
  }

  async voidEnvelope(envelopeId: string, _reason: string): Promise<void> {
    const envelope = envelopeStore.get(envelopeId);

    if (!envelope) {
      throw new Error(`Envelope not found: ${envelopeId}`);
    }

    envelope.status = 'voided';
    envelopeStore.set(envelopeId, envelope);
  }

  isConfigured(): boolean {
    // Mock provider is always configured
    return true;
  }

  /**
   * Mock-specific method to simulate signing
   * This is called when the client submits a signature
   */
  async submitSignature(envelopeId: string, signatureData: string): Promise<void> {
    const envelope = envelopeStore.get(envelopeId);

    if (!envelope) {
      throw new Error(`Envelope not found: ${envelopeId}`);
    }

    const now = new Date();
    envelope.status = 'completed';
    envelope.signatureData = signatureData;
    envelope.signedAt = now;
    envelope.completedAt = now;
    envelopeStore.set(envelopeId, envelope);
  }

  /**
   * Get the signature data for an envelope (mock-specific)
   */
  getSignatureData(envelopeId: string): string | undefined {
    const envelope = envelopeStore.get(envelopeId);
    return envelope?.signatureData;
  }
}

// Singleton instance
let mockProviderInstance: MockSignatureProvider | null = null;

export function getMockSignatureProvider(): MockSignatureProvider {
  if (!mockProviderInstance) {
    mockProviderInstance = new MockSignatureProvider();
  }
  return mockProviderInstance;
}

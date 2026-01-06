/**
 * E-Signature Provider Abstraction Layer
 *
 * This module provides a provider-agnostic interface for electronic signatures.
 * Currently implements a mock provider for development/testing.
 * Designed for easy switching to DocuSign when ready.
 *
 * To switch to DocuSign, simply set ESIGN_PROVIDER=docusign in environment
 * and configure the DocuSign credentials.
 */

export type EnvelopeStatus = 'created' | 'sent' | 'delivered' | 'signed' | 'completed' | 'declined' | 'voided';

export interface SignatureField {
  /** Unique identifier for this signature field */
  id: string;
  /** Page number (1-based) */
  pageNumber: number;
  /** X position from left (in points) */
  xPosition: number;
  /** Y position from top (in points) */
  yPosition: number;
  /** Width of signature box (in points) */
  width?: number;
  /** Height of signature box (in points) */
  height?: number;
  /** Whether this field is required */
  required?: boolean;
}

export interface DateField {
  id: string;
  pageNumber: number;
  xPosition: number;
  yPosition: number;
  format?: string; // e.g., 'MM/DD/YYYY'
}

export interface TextTab {
  id: string;
  pageNumber: number;
  xPosition: number;
  yPosition: number;
  value: string;
  locked?: boolean;
}

export interface CreateEnvelopeParams {
  /** Base64 encoded document content */
  documentBase64: string;
  /** Document filename */
  documentName: string;
  /** Signer's email address */
  signerEmail: string;
  /** Signer's full name */
  signerName: string;
  /** Email subject line */
  emailSubject?: string;
  /** Email body message */
  emailMessage?: string;
  /** Signature field placements */
  signatureFields?: SignatureField[];
  /** Date field placements (auto-filled on signing) */
  dateFields?: DateField[];
  /** Pre-filled text tabs */
  textTabs?: TextTab[];
  /** Custom metadata to attach */
  metadata?: Record<string, string>;
}

export interface EnvelopeResult {
  /** Unique envelope/document ID */
  envelopeId: string;
  /** Current status */
  status: EnvelopeStatus;
  /** Direct URL for embedded signing (if available) */
  signingUrl?: string;
  /** When the envelope was created */
  createdAt: Date;
  /** When the envelope expires (if applicable) */
  expiresAt?: Date;
}

export interface EnvelopeStatusResult {
  envelopeId: string;
  status: EnvelopeStatus;
  signerEmail: string;
  signerName: string;
  sentAt?: Date;
  signedAt?: Date;
  completedAt?: Date;
}

export interface SignedDocumentResult {
  /** Document content as Buffer */
  content: Buffer;
  /** MIME type of the document */
  mimeType: string;
  /** Filename */
  filename: string;
}

export interface SigningUrlParams {
  /** Return URL after signing is complete */
  returnUrl: string;
  /** Authentication method for the signer */
  authenticationMethod?: 'none' | 'email' | 'phone' | 'idCheck';
  /** Frame ancestors for embedding (CSP) */
  frameAncestors?: string[];
}

/**
 * E-Signature Provider Interface
 *
 * All providers must implement this interface.
 * This ensures consistent behavior whether using mock or production providers.
 */
export interface ESignProvider {
  /** Provider name for identification/logging */
  readonly name: string;

  /**
   * Create a new envelope/document for signing
   * @param params - Envelope creation parameters
   * @returns Created envelope details
   */
  createEnvelope(params: CreateEnvelopeParams): Promise<EnvelopeResult>;

  /**
   * Get the current status of an envelope
   * @param envelopeId - The envelope ID to check
   * @returns Current envelope status
   */
  getEnvelopeStatus(envelopeId: string): Promise<EnvelopeStatusResult>;

  /**
   * Get the signed document
   * @param envelopeId - The envelope ID
   * @returns Signed document content
   */
  getSignedDocument(envelopeId: string): Promise<SignedDocumentResult>;

  /**
   * Generate a URL for embedded signing
   * @param envelopeId - The envelope ID
   * @param params - URL generation parameters
   * @returns Signing URL
   */
  generateSigningUrl(envelopeId: string, params: SigningUrlParams): Promise<string>;

  /**
   * Void/cancel an envelope
   * @param envelopeId - The envelope ID to void
   * @param reason - Reason for voiding
   */
  voidEnvelope(envelopeId: string, reason: string): Promise<void>;

  /**
   * Check if the provider is properly configured
   * @returns True if ready to use
   */
  isConfigured(): boolean;
}

/**
 * E-Sign configuration from environment variables
 */
export interface ESignConfig {
  provider: 'mock' | 'docusign';
  docusign?: {
    integrationKey: string;
    secretKey: string;
    accountId: string;
    baseUrl: string;
    userId?: string;
  };
}

/**
 * Result of processing a signature submission
 */
export interface ProcessSignatureResult {
  success: boolean;
  envelopeId: string;
  signatureUrl: string;
  agreementUrl: string;
  signedAt: Date;
}

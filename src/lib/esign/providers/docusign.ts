/**
 * DocuSign E-Signature Provider
 *
 * This provider integrates with DocuSign for production e-signature capabilities.
 *
 * To enable DocuSign:
 * 1. Set ESIGN_PROVIDER=docusign in .env
 * 2. Configure the following environment variables:
 *    - DOCUSIGN_INTEGRATION_KEY
 *    - DOCUSIGN_SECRET_KEY (or RSA private key for JWT)
 *    - DOCUSIGN_ACCOUNT_ID
 *    - DOCUSIGN_BASE_URL (e.g., https://demo.docusign.net/restapi for sandbox)
 *    - DOCUSIGN_USER_ID (for JWT auth)
 *
 * API Documentation: https://developers.docusign.com/docs/esign-rest-api/
 */

import {
  ESignProvider,
  CreateEnvelopeParams,
  EnvelopeResult,
  EnvelopeStatusResult,
  SignedDocumentResult,
  SigningUrlParams,
  ESignConfig,
} from '../types';

export class DocuSignProvider implements ESignProvider {
  readonly name = 'docusign';
  private config: ESignConfig['docusign'];
  private accessToken: string | null = null;
  private tokenExpiresAt: Date | null = null;

  constructor(config?: ESignConfig['docusign']) {
    this.config = config || {
      integrationKey: process.env.DOCUSIGN_INTEGRATION_KEY || '',
      secretKey: process.env.DOCUSIGN_SECRET_KEY || '',
      accountId: process.env.DOCUSIGN_ACCOUNT_ID || '',
      baseUrl: process.env.DOCUSIGN_BASE_URL || 'https://demo.docusign.net/restapi',
      userId: process.env.DOCUSIGN_USER_ID,
    };
  }

  private async getAccessToken(): Promise<string> {
    // Check if we have a valid token
    if (this.accessToken && this.tokenExpiresAt && this.tokenExpiresAt > new Date()) {
      return this.accessToken;
    }

    // TODO: Implement JWT or OAuth token acquisition
    // For now, throw an error indicating configuration is needed
    throw new Error(
      'DocuSign authentication not implemented. ' +
        'Please configure DOCUSIGN_INTEGRATION_KEY, DOCUSIGN_SECRET_KEY, and other required variables.'
    );
  }

  async createEnvelope(params: CreateEnvelopeParams): Promise<EnvelopeResult> {
    const accessToken = await this.getAccessToken();

    // DocuSign envelope definition
    const envelopeDefinition = {
      emailSubject: params.emailSubject || 'Please sign this document',
      emailBlurb: params.emailMessage || '',
      status: 'sent', // Auto-send the envelope
      documents: [
        {
          documentBase64: params.documentBase64,
          name: params.documentName,
          fileExtension: 'pdf',
          documentId: '1',
        },
      ],
      recipients: {
        signers: [
          {
            email: params.signerEmail,
            name: params.signerName,
            recipientId: '1',
            routingOrder: '1',
            tabs: {
              signHereTabs: params.signatureFields?.map((field, index) => ({
                documentId: '1',
                pageNumber: String(field.pageNumber),
                xPosition: String(field.xPosition),
                yPosition: String(field.yPosition),
                tabId: field.id || String(index + 1),
              })),
              dateSignedTabs: params.dateFields?.map((field) => ({
                documentId: '1',
                pageNumber: String(field.pageNumber),
                xPosition: String(field.xPosition),
                yPosition: String(field.yPosition),
                tabId: field.id,
              })),
            },
          },
        ],
      },
    };

    const response = await fetch(
      `${this.config?.baseUrl}/v2.1/accounts/${this.config?.accountId}/envelopes`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(envelopeDefinition),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`DocuSign API error: ${error}`);
    }

    const result = await response.json();

    return {
      envelopeId: result.envelopeId,
      status: 'sent',
      createdAt: new Date(),
    };
  }

  async getEnvelopeStatus(envelopeId: string): Promise<EnvelopeStatusResult> {
    const accessToken = await this.getAccessToken();

    const response = await fetch(
      `${this.config?.baseUrl}/v2.1/accounts/${this.config?.accountId}/envelopes/${envelopeId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to get envelope status: ${response.statusText}`);
    }

    const envelope = await response.json();

    return {
      envelopeId,
      status: envelope.status,
      signerEmail: envelope.recipients?.signers?.[0]?.email || '',
      signerName: envelope.recipients?.signers?.[0]?.name || '',
      sentAt: envelope.sentDateTime ? new Date(envelope.sentDateTime) : undefined,
      signedAt: envelope.signedDateTime ? new Date(envelope.signedDateTime) : undefined,
      completedAt: envelope.completedDateTime ? new Date(envelope.completedDateTime) : undefined,
    };
  }

  async getSignedDocument(envelopeId: string): Promise<SignedDocumentResult> {
    const accessToken = await this.getAccessToken();

    // Get combined document (all documents merged)
    const response = await fetch(
      `${this.config?.baseUrl}/v2.1/accounts/${this.config?.accountId}/envelopes/${envelopeId}/documents/combined`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to get signed document: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();

    return {
      content: Buffer.from(arrayBuffer),
      mimeType: 'application/pdf',
      filename: `signed_document_${envelopeId}.pdf`,
    };
  }

  async generateSigningUrl(envelopeId: string, params: SigningUrlParams): Promise<string> {
    const accessToken = await this.getAccessToken();

    // First, get the recipient info
    const envelopeResponse = await fetch(
      `${this.config?.baseUrl}/v2.1/accounts/${this.config?.accountId}/envelopes/${envelopeId}/recipients`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!envelopeResponse.ok) {
      throw new Error(`Failed to get recipients: ${envelopeResponse.statusText}`);
    }

    const recipients = await envelopeResponse.json();
    const signer = recipients.signers?.[0];

    if (!signer) {
      throw new Error('No signer found for envelope');
    }

    // Create recipient view (embedded signing)
    const viewRequest = {
      returnUrl: params.returnUrl,
      authenticationMethod: params.authenticationMethod || 'none',
      email: signer.email,
      userName: signer.name,
      clientUserId: signer.clientUserId || signer.recipientId,
      frameAncestors: params.frameAncestors || ['http://localhost:3000'],
      messageOrigins: params.frameAncestors || ['http://localhost:3000'],
    };

    const viewResponse = await fetch(
      `${this.config?.baseUrl}/v2.1/accounts/${this.config?.accountId}/envelopes/${envelopeId}/views/recipient`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(viewRequest),
      }
    );

    if (!viewResponse.ok) {
      throw new Error(`Failed to generate signing URL: ${viewResponse.statusText}`);
    }

    const view = await viewResponse.json();
    return view.url;
  }

  async voidEnvelope(envelopeId: string, reason: string): Promise<void> {
    const accessToken = await this.getAccessToken();

    const response = await fetch(
      `${this.config?.baseUrl}/v2.1/accounts/${this.config?.accountId}/envelopes/${envelopeId}`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'voided',
          voidedReason: reason,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to void envelope: ${response.statusText}`);
    }
  }

  isConfigured(): boolean {
    return !!(
      this.config?.integrationKey &&
      this.config?.secretKey &&
      this.config?.accountId &&
      this.config?.baseUrl
    );
  }
}

// Singleton instance
let docusignProviderInstance: DocuSignProvider | null = null;

export function getDocuSignProvider(config?: ESignConfig['docusign']): DocuSignProvider {
  if (!docusignProviderInstance) {
    docusignProviderInstance = new DocuSignProvider(config);
  }
  return docusignProviderInstance;
}

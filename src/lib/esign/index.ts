/**
 * E-Signature Provider Factory
 *
 * This module provides a factory function for getting the configured e-signature provider.
 * The provider is selected based on the ESIGN_PROVIDER environment variable.
 *
 * Usage:
 * ```typescript
 * import { getESignProvider } from '@/lib/esign';
 *
 * const provider = getESignProvider();
 * const envelope = await provider.createEnvelope({
 *   documentBase64: '...',
 *   documentName: 'agreement.pdf',
 *   signerEmail: 'customer@example.com',
 *   signerName: 'John Doe',
 * });
 * ```
 *
 * To switch providers, set ESIGN_PROVIDER in your .env file:
 * - ESIGN_PROVIDER=mock (default) - Uses mock provider for development
 * - ESIGN_PROVIDER=docusign - Uses DocuSign (requires additional config)
 */

import { ESignProvider, ESignConfig } from './types';
import { getMockSignatureProvider, MockSignatureProvider } from './providers/mock';
import { getDocuSignProvider } from './providers/docusign';

// Re-export types for convenience
export * from './types';
export { MockSignatureProvider } from './providers/mock';

/**
 * Get the configured e-signature provider
 *
 * @returns The e-signature provider instance
 * @throws Error if DocuSign is selected but not properly configured
 */
export function getESignProvider(): ESignProvider {
  const providerName = (process.env.ESIGN_PROVIDER || 'mock').toLowerCase();

  switch (providerName) {
    case 'docusign': {
      const provider = getDocuSignProvider();
      if (!provider.isConfigured()) {
        console.warn(
          'DocuSign provider is not fully configured. ' +
            'Please set DOCUSIGN_INTEGRATION_KEY, DOCUSIGN_SECRET_KEY, DOCUSIGN_ACCOUNT_ID, and DOCUSIGN_BASE_URL. ' +
            'Falling back to mock provider.'
        );
        return getMockSignatureProvider();
      }
      return provider;
    }

    case 'mock':
    default:
      return getMockSignatureProvider();
  }
}

/**
 * Get the e-signature configuration from environment
 */
export function getESignConfig(): ESignConfig {
  const provider = (process.env.ESIGN_PROVIDER || 'mock').toLowerCase() as 'mock' | 'docusign';

  const config: ESignConfig = {
    provider,
  };

  if (provider === 'docusign') {
    config.docusign = {
      integrationKey: process.env.DOCUSIGN_INTEGRATION_KEY || '',
      secretKey: process.env.DOCUSIGN_SECRET_KEY || '',
      accountId: process.env.DOCUSIGN_ACCOUNT_ID || '',
      baseUrl: process.env.DOCUSIGN_BASE_URL || 'https://demo.docusign.net/restapi',
      userId: process.env.DOCUSIGN_USER_ID,
    };
  }

  return config;
}

/**
 * Check if the current provider is the mock provider
 */
export function isMockProvider(): boolean {
  const provider = getESignProvider();
  return provider.name === 'mock';
}

/**
 * Get the mock provider directly (useful for mock-specific operations)
 * Only use this when you know you're working with the mock provider
 */
export function getMockProvider(): MockSignatureProvider {
  return getMockSignatureProvider();
}

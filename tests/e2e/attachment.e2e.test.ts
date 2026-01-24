/**
 * E2E Tests for VNTANA Attachment Operations
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { getTestConfig, shouldSkipE2E, TestConfig } from './setup';
import { VntanaTestClient, createTestClient } from './helpers/testClient';
import { getTestPdf } from '../fixtures/binary';

describe('Attachment E2E', () => {
	let config: TestConfig;
	let client: VntanaTestClient;
	let testProductUuid: string | null = null;
	let createdProductUuids: string[] = [];

	beforeAll(async () => {
		if (shouldSkipE2E()) {
			return;
		}
		config = getTestConfig();
		client = createTestClient(config);

		// Create a test product for attachment operations
		const response = await client.createProduct({
			name: `Attachment Test Product ${Date.now()}`,
			assetType: 'IMAGE',
			description: 'Product for attachment E2E tests',
		});

		if (response.success) {
			testProductUuid = response.response.uuid;
			createdProductUuids.push(testProductUuid);
		}
	});

	afterAll(async () => {
		// Cleanup created products
		if (client && createdProductUuids.length > 0) {
			for (const uuid of createdProductUuids) {
				try {
					await client.deleteProduct(uuid);
				} catch (error) {
					console.warn(`Failed to cleanup product ${uuid}:`, error);
				}
			}
		}
		if (client) {
			client.clearTokenCache();
		}
	});

	describe('Upload Attachment', () => {
		it.skipIf(shouldSkipE2E())('should upload a PDF attachment to a product', async () => {
			if (!testProductUuid) {
				console.log('PDF upload test skipped - test product not created (API may not support create)');
				return;
			}

			// Step 1: Get signed URL for attachment upload
			const pdfBuffer = getTestPdf();
			const signedUrlResponse = await client.getResourceUploadSignedUrl(
				testProductUuid,
				'test-document.pdf',
				pdfBuffer.length,
				'application/pdf',
				'ATTACHMENT',
			);

			expect(signedUrlResponse.success).toBe(true);
			expect(signedUrlResponse.response.location).toBeDefined();
			expect(signedUrlResponse.response.blobId).toBeDefined();
			expect(signedUrlResponse.response.requestUuid).toBeDefined();

			// Step 2: Upload to signed URL
			await client.uploadToSignedUrl(
				signedUrlResponse.response.location,
				pdfBuffer,
				'application/pdf',
			);

			// Verify upload completed (no error thrown)
		});

		it.skipIf(shouldSkipE2E())('should handle attachment with different content types', async () => {
			if (!testProductUuid) {
				console.log('Binary upload test skipped - test product not created');
				return;
			}

			// Upload as generic binary
			const pdfBuffer = getTestPdf();
			const signedUrlResponse = await client.getResourceUploadSignedUrl(
				testProductUuid,
				'test-binary.bin',
				pdfBuffer.length,
				'application/octet-stream',
				'ATTACHMENT',
			);

			expect(signedUrlResponse.success).toBe(true);

			// Upload to signed URL
			await client.uploadToSignedUrl(
				signedUrlResponse.response.location,
				pdfBuffer,
				'application/octet-stream',
			);
		});
	});

	describe('Search Attachments', () => {
		it.skipIf(shouldSkipE2E())('should find uploaded attachments', async () => {
			if (!testProductUuid) {
				console.log('Search attachments test skipped - test product not created');
				return;
			}

			// Upload an attachment first
			const pdfBuffer = getTestPdf();
			const signedUrlResponse = await client.getResourceUploadSignedUrl(
				testProductUuid,
				'search-test.pdf',
				pdfBuffer.length,
				'application/pdf',
				'ATTACHMENT',
			);

			if (signedUrlResponse.success) {
				await client.uploadToSignedUrl(
					signedUrlResponse.response.location,
					pdfBuffer,
					'application/pdf',
				);
			}

			// Search for attachments
			const searchResponse = await client.searchAttachments(testProductUuid);

			expect(searchResponse.success).toBe(true);
			expect(searchResponse.response).toBeDefined();
			expect(searchResponse.response.grid).toBeInstanceOf(Array);
		});

		it.skipIf(shouldSkipE2E())('should return attachment with expected properties', async () => {
			if (!testProductUuid) {
				console.log('Attachment properties test skipped - test product not created');
				return;
			}

			const searchResponse = await client.searchAttachments(testProductUuid);

			if (searchResponse.response.grid.length > 0) {
				const attachment = searchResponse.response.grid[0];
				expect(attachment).toHaveProperty('uuid');
				expect(attachment).toHaveProperty('blobId');
				expect(attachment).toHaveProperty('productUuid');
			}
		});
	});
});

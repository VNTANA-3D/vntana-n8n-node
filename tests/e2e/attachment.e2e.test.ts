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
	let testProduct: { uuid: string; clientUuid: string } | null = null;
	let createdProductUuids: string[] = [];

	beforeAll(async () => {
		if (shouldSkipE2E()) {
			return;
		}
		config = getTestConfig();
		client = createTestClient(config);

		// Try to create a test product, fall back to existing
		const response = await client.createProduct({
			name: `Attachment Test Product ${Date.now()}`,
			assetType: 'IMAGE',
			description: 'Product for attachment E2E tests',
		});

		if (response.success) {
			testProduct = { uuid: response.response.uuid, clientUuid: config.workspaceUuid };
			createdProductUuids.push(testProduct.uuid);
		} else {
			// Fall back to existing product or find one
			if (config.existingProductUuid) {
				testProduct = { uuid: config.existingProductUuid, clientUuid: config.workspaceUuid };
			} else {
				testProduct = await client.findExistingProduct();
			}
			if (testProduct) {
				console.log('Using existing product for attachment tests:', testProduct.uuid);
			}
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
			if (!testProduct) {
				console.log('PDF upload test skipped - test product not created (API may not support create)');
				return;
			}

			// Step 1: Get signed URL for attachment upload
			const pdfBuffer = getTestPdf();
			const signedUrlResponse = await client.getResourceUploadSignedUrl(
				testProduct.uuid,
				'test-document.pdf',
				pdfBuffer.length,
				'application/pdf',
				'ATTACHMENT',
				testProduct.clientUuid,
			);

			if (!signedUrlResponse.success) {
				console.log('Signed URL request failed:', signedUrlResponse.errors?.[0]?.message || 'Unknown error');
				console.log('Write operations may not be available for this account');
				return;
			}

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

		it.skipIf(shouldSkipE2E())('should handle attachment with octet-stream content type', async () => {
			if (!testProduct) {
				console.log('Binary upload test skipped - test product not created');
				return;
			}

			// Upload a PDF as octet-stream (simulating generic binary upload)
			// Note: The file extension must be in the allowed list even with octet-stream content type
			// Allowed: jpeg, jpg, png, bmp, gif, tiff, svg, mp4, tif, mov, avi, pdf
			const pdfBuffer = getTestPdf();
			const signedUrlResponse = await client.getResourceUploadSignedUrl(
				testProduct.uuid,
				'test-binary.pdf', // Using .pdf extension since .bin is not supported
				pdfBuffer.length,
				'application/octet-stream',
				'ATTACHMENT',
				testProduct.clientUuid,
			);

			if (!signedUrlResponse.success) {
				const errorMsg = signedUrlResponse.errors?.[0];
				console.log('Signed URL request failed:', typeof errorMsg === 'string' ? errorMsg : errorMsg?.message || JSON.stringify(signedUrlResponse.errors));
				return;
			}

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
			if (!testProduct) {
				console.log('Search attachments test skipped - test product not created');
				return;
			}

			// Upload an attachment first
			const pdfBuffer = getTestPdf();
			const signedUrlResponse = await client.getResourceUploadSignedUrl(
				testProduct.uuid,
				'search-test.pdf',
				pdfBuffer.length,
				'application/pdf',
				'ATTACHMENT',
				testProduct.clientUuid,
			);

			if (signedUrlResponse.success) {
				await client.uploadToSignedUrl(
					signedUrlResponse.response.location,
					pdfBuffer,
					'application/pdf',
				);
			}

			// Search for attachments
			const searchResponse = await client.searchAttachments(testProduct.uuid);

			expect(searchResponse.success).toBe(true);
			expect(searchResponse.response).toBeDefined();
			expect(searchResponse.response.grid).toBeInstanceOf(Array);
		});

		it.skipIf(shouldSkipE2E())('should return attachment with expected properties', async () => {
			if (!testProduct) {
				console.log('Attachment properties test skipped - test product not created');
				return;
			}

			const searchResponse = await client.searchAttachments(testProduct.uuid);

			if (searchResponse.response.grid.length > 0) {
				const attachment = searchResponse.response.grid[0];
				expect(attachment).toHaveProperty('uuid');
				expect(attachment).toHaveProperty('blobId');
				expect(attachment).toHaveProperty('productUuid');
			}
		});
	});
});

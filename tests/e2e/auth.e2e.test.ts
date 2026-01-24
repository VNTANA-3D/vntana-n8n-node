/**
 * E2E Tests for VNTANA Authentication
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { getTestConfig, shouldSkipE2E, SKIP_MESSAGE, TestConfig } from './setup';
import { VntanaTestClient, createTestClient } from './helpers/testClient';

describe('Authentication E2E', () => {
	let config: TestConfig;
	let client: VntanaTestClient;

	beforeAll(() => {
		if (shouldSkipE2E()) {
			return;
		}
		config = getTestConfig();
		client = createTestClient(config);
	});

	afterAll(() => {
		if (client) {
			client.clearTokenCache();
		}
	});

	it.skipIf(shouldSkipE2E())('should authenticate successfully with valid credentials', async () => {
		const token = await client.getAuthToken();

		expect(token).toBeDefined();
		expect(token).toMatch(/^Bearer /);
	});

	it.skipIf(shouldSkipE2E())('should cache token on subsequent calls', async () => {
		// First call - should authenticate
		const token1 = await client.getAuthToken();

		// Second call - should use cache
		const token2 = await client.getAuthToken();

		expect(token1).toBe(token2);
	});

	it.skipIf(shouldSkipE2E())('should clear cache and re-authenticate', async () => {
		// Get initial token
		const token1 = await client.getAuthToken();

		// Clear cache
		client.clearTokenCache();

		// Get new token - should re-authenticate
		const token2 = await client.getAuthToken();

		// Both should be valid Bearer tokens
		expect(token1).toMatch(/^Bearer /);
		expect(token2).toMatch(/^Bearer /);
	});

	it.skipIf(shouldSkipE2E())('should fail authentication with invalid credentials', async () => {
		const invalidClient = createTestClient({
			...config,
			password: 'invalid-password-12345',
		});

		await expect(invalidClient.getAuthToken()).rejects.toThrow();
	});

	it.skipIf(shouldSkipE2E())('should fail authentication with invalid organization UUID', async () => {
		const invalidClient = createTestClient({
			...config,
			organizationUuid: '00000000-0000-0000-0000-000000000000',
		});

		await expect(invalidClient.getAuthToken()).rejects.toThrow();
	});

	it.skipIf(shouldSkipE2E())('should work with authenticated API request', async () => {
		// Use the organizations endpoint to verify the token works
		const response = await client.listOrganizations();

		expect(response.success).toBe(true);
		expect(response.response).toBeDefined();
		expect(response.response.grid).toBeInstanceOf(Array);
	});
});

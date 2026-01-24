/**
 * E2E Tests for VNTANA Organization Operations
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { getTestConfig, shouldSkipE2E, TestConfig } from './setup';
import { VntanaTestClient, createTestClient } from './helpers/testClient';

describe('Organization E2E', () => {
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

	describe('List Organizations', () => {
		it.skipIf(shouldSkipE2E())('should list organizations', async () => {
			const response = await client.listOrganizations();

			expect(response.success).toBe(true);
			expect(response.response).toBeDefined();
			expect(response.response.grid).toBeInstanceOf(Array);
			expect(response.response.grid.length).toBeGreaterThan(0);
		});

		it.skipIf(shouldSkipE2E())('should return organization with expected properties', async () => {
			const response = await client.listOrganizations();

			const org = response.response.grid[0];
			expect(org).toHaveProperty('uuid');
			expect(org).toHaveProperty('name');
			expect(org).toHaveProperty('slug');
		});

		it.skipIf(shouldSkipE2E())('should include the test organization', async () => {
			const response = await client.listOrganizations();

			const orgs = response.response.grid;
			const testOrg = orgs.find((org: any) => org.uuid === config.organizationUuid);

			expect(testOrg).toBeDefined();
		});
	});
});

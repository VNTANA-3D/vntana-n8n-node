/**
 * E2E Tests for VNTANA Workspace Operations
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { getTestConfig, shouldSkipE2E, TestConfig } from './setup';
import { VntanaTestClient, createTestClient } from './helpers/testClient';

describe('Workspace E2E', () => {
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

	describe('List Workspaces', () => {
		it.skipIf(shouldSkipE2E())('should list workspaces', async () => {
			const response = await client.listWorkspaces();

			expect(response.success).toBe(true);
			expect(response.response).toBeDefined();
			expect(response.response.grid).toBeInstanceOf(Array);
			expect(response.response.grid.length).toBeGreaterThan(0);
		});

		it.skipIf(shouldSkipE2E())('should return workspace with expected properties', async () => {
			const response = await client.listWorkspaces();

			const workspace = response.response.grid[0];
			expect(workspace).toHaveProperty('uuid');
			expect(workspace).toHaveProperty('name');
			expect(workspace).toHaveProperty('slug');
		});

		it.skipIf(shouldSkipE2E())('should include the test workspace', async () => {
			const response = await client.listWorkspaces();

			const workspaces = response.response.grid;
			const testWorkspace = workspaces.find((ws: any) => ws.uuid === config.workspaceUuid);

			expect(testWorkspace).toBeDefined();
		});
	});
});

/**
 * E2E Tests for VNTANA Pipeline Operations
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { getTestConfig, shouldSkipE2E, TestConfig } from './setup';
import { VntanaTestClient, createTestClient } from './helpers/testClient';

describe('Pipeline E2E', () => {
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

	describe('List Pipelines', () => {
		it.skipIf(shouldSkipE2E())('should list pipelines', async () => {
			const response = await client.listPipelines();

			expect(response.success).toBe(true);
			expect(response.response).toBeDefined();
			expect(response.response.pipelines).toBeInstanceOf(Array);
		});

		it.skipIf(shouldSkipE2E())('should return pipeline with expected properties', async () => {
			const response = await client.listPipelines();

			// Only check if there are pipelines
			if (response.response?.pipelines?.length > 0) {
				const pipeline = response.response.pipelines[0];
				expect(pipeline).toHaveProperty('uuid');
				expect(pipeline).toHaveProperty('name');
			}
		});

		it.skipIf(shouldSkipE2E())('should include the test pipeline if configured', async () => {
			if (!config.pipelineUuid) {
				// Skip if no test pipeline configured
				return;
			}

			const response = await client.listPipelines();

			const pipelines = response.response.pipelines;
			const testPipeline = pipelines.find((p: any) => p.uuid === config.pipelineUuid);

			expect(testPipeline).toBeDefined();
		});
	});
});

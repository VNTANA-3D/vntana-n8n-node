/**
 * E2E Test Environment Setup
 *
 * Loads environment variables and validates test configuration
 */
import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env.test from project root, fallback to .env
config({ path: resolve(__dirname, '../../.env.test') });
config({ path: resolve(__dirname, '../../.env') }); // Fallback for local development

export interface TestConfig {
	email: string;
	password: string;
	organizationUuid: string;
	workspaceUuid: string;
	pipelineUuid: string;
	baseUrl: string;
	// Optional: existing product UUID for testing uploads when product creation is unavailable
	existingProductUuid: string;
}

/**
 * Get test configuration from environment variables
 * Supports both VNTANA_TEST_* and VNTANA_* naming conventions for flexibility
 * Throws if required variables are missing
 */
export function getTestConfig(): TestConfig {
	// Support both VNTANA_TEST_* (CI) and VNTANA_* (local) naming conventions
	const email = process.env.VNTANA_TEST_EMAIL || process.env.VNTANA_EMAIL;
	const password = process.env.VNTANA_TEST_PASSWORD || process.env.VNTANA_PASSWORD;
	const organizationUuid = process.env.VNTANA_TEST_ORG_UUID || process.env.VNTANA_ORGANIZATION_UUID;
	const workspaceUuid = process.env.VNTANA_TEST_WORKSPACE_UUID || process.env.VNTANA_WORKSPACE_UUID;
	const pipelineUuid = process.env.VNTANA_TEST_PIPELINE_UUID || process.env.VNTANA_PIPELINE_UUID || '';
	const baseUrl = process.env.VNTANA_API_BASE_URL || 'https://api-platform.vntana.com';
	// Optional: existing product UUID for upload tests when product creation is unavailable
	const existingProductUuid = process.env.VNTANA_TEST_EXISTING_PRODUCT_UUID || process.env.VNTANA_EXISTING_PRODUCT_UUID || '';

	const missing: string[] = [];
	if (!email) missing.push('VNTANA_TEST_EMAIL');
	if (!password) missing.push('VNTANA_TEST_PASSWORD');
	if (!organizationUuid) missing.push('VNTANA_TEST_ORG_UUID');
	if (!workspaceUuid) missing.push('VNTANA_TEST_WORKSPACE_UUID');

	if (missing.length > 0) {
		throw new Error(
			`Missing required environment variables for E2E tests: ${missing.join(', ')}\n` +
			'Please create a .env.test file based on .env.test.example',
		);
	}

	return {
		email: email!,
		password: password!,
		organizationUuid: organizationUuid!,
		workspaceUuid: workspaceUuid!,
		pipelineUuid,
		baseUrl,
		existingProductUuid,
	};
}

/**
 * Check if E2E tests should be skipped (missing config)
 */
export function shouldSkipE2E(): boolean {
	try {
		getTestConfig();
		return false;
	} catch {
		return true;
	}
}

/**
 * Skip message for missing configuration
 */
export const SKIP_MESSAGE = 'E2E tests skipped: missing .env.test configuration';

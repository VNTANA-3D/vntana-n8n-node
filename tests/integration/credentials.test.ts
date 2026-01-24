import { describe, it, expect } from 'vitest';
import { VntanaApi } from '../../credentials/VntanaApi.credentials';

describe('VntanaApi Credentials', () => {
	let credentials: VntanaApi;

	beforeEach(() => {
		credentials = new VntanaApi();
	});

	describe('properties', () => {
		it('should have correct name', () => {
			expect(credentials.name).toBe('vntanaApi');
		});

		it('should have correct display name', () => {
			expect(credentials.displayName).toBe('VNTANA API');
		});

		it('should have documentation URL', () => {
			expect(credentials.documentationUrl).toBe('https://help.vntana.com/api-documentation');
		});

		it('should have required email property', () => {
			const emailProp = credentials.properties.find(p => p.name === 'email');
			expect(emailProp).toBeDefined();
			expect(emailProp?.type).toBe('string');
			expect(emailProp?.required).toBe(true);
		});

		it('should have required password property with password type', () => {
			const passwordProp = credentials.properties.find(p => p.name === 'password');
			expect(passwordProp).toBeDefined();
			expect(passwordProp?.type).toBe('string');
			expect(passwordProp?.typeOptions?.password).toBe(true);
			expect(passwordProp?.required).toBe(true);
		});

		it('should have required organizationUuid property', () => {
			const orgProp = credentials.properties.find(p => p.name === 'organizationUuid');
			expect(orgProp).toBeDefined();
			expect(orgProp?.type).toBe('string');
			expect(orgProp?.required).toBe(true);
		});

		it('should have optional defaultClientUuid property', () => {
			const clientProp = credentials.properties.find(p => p.name === 'defaultClientUuid');
			expect(clientProp).toBeDefined();
			expect(clientProp?.type).toBe('string');
			expect(clientProp?.required).toBe(false);
		});

		it('should have optional baseUrl property for custom environments', () => {
			const baseUrlProp = credentials.properties.find(p => p.name === 'baseUrl');
			expect(baseUrlProp).toBeDefined();
			expect(baseUrlProp?.type).toBe('string');
			expect(baseUrlProp?.required).toBe(false);
		});
	});

	describe('test configuration', () => {
		it('should have test configuration for credential validation', () => {
			expect(credentials.test).toBeDefined();
			expect(credentials.test.request).toBeDefined();
		});

		it('should test against login endpoint', () => {
			expect(credentials.test.request?.url).toBe('/v1/auth/login');
			expect(credentials.test.request?.method).toBe('POST');
		});

		it('should use production base URL for testing', () => {
			expect(credentials.test.request?.baseURL).toBe('https://api-platform.vntana.com');
		});

		it('should send email and password in request body', () => {
			const body = credentials.test.request?.body;
			expect(body).toHaveProperty('email', '={{$credentials.email}}');
			expect(body).toHaveProperty('password', '={{$credentials.password}}');
		});
	});

	describe('property count', () => {
		it('should have exactly 5 properties', () => {
			// email, password, organizationUuid, defaultClientUuid, baseUrl
			expect(credentials.properties).toHaveLength(5);
		});
	});
});

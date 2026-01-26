import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { IDataObject, IExecuteFunctions, INode } from 'n8n-workflow';
import {
	buildModelOpsParameters,
	validateBinaryData,
	sanitizeFileName,
	getBaseUrl,
	clearTokenCache,
	validateCredentials,
	parseCommaSeparatedList,
	OPTIMIZATION_PRESETS,
} from '../../nodes/Vntana/GenericFunctions';
import { isGridResponse } from '../../nodes/Vntana/types';

// Mock IExecuteFunctions for validateBinaryData tests
function createMockExecuteFunctions(): IExecuteFunctions {
	return {
		getNode: () => ({
			name: 'VNTANA',
			type: 'n8n-nodes-vntana.vntana',
			typeVersion: 1,
			position: [0, 0],
			parameters: {},
		} as INode),
	} as unknown as IExecuteFunctions;
}

describe('GenericFunctions', () => {
	describe('getBaseUrl', () => {
		it('should return default URL when baseUrl is not set', () => {
			const credentials: IDataObject = {};
			expect(getBaseUrl(credentials)).toBe('https://api-platform.vntana.com');
		});

		it('should return default URL when baseUrl is empty string', () => {
			const credentials: IDataObject = { baseUrl: '' };
			expect(getBaseUrl(credentials)).toBe('https://api-platform.vntana.com');
		});

		it('should return default URL when baseUrl is whitespace', () => {
			const credentials: IDataObject = { baseUrl: '   ' };
			expect(getBaseUrl(credentials)).toBe('https://api-platform.vntana.com');
		});

		it('should return custom URL when provided', () => {
			const credentials: IDataObject = { baseUrl: 'https://custom-api.example.com' };
			expect(getBaseUrl(credentials)).toBe('https://custom-api.example.com');
		});

		it('should strip trailing slash from custom URL', () => {
			const credentials: IDataObject = { baseUrl: 'https://custom-api.example.com/' };
			expect(getBaseUrl(credentials)).toBe('https://custom-api.example.com');
		});

		it('should trim whitespace from custom URL', () => {
			const credentials: IDataObject = { baseUrl: '  https://custom-api.example.com  ' };
			expect(getBaseUrl(credentials)).toBe('https://custom-api.example.com');
		});
	});

	describe('buildModelOpsParameters', () => {
		describe('preset mode', () => {
			it('should return webOptimized preset parameters', () => {
				const result = buildModelOpsParameters('preset', 'webOptimized');
				expect(result).toEqual(OPTIMIZATION_PRESETS.webOptimized);
				expect(result.DRACO_COMPRESSION?.enabled).toBe('true');
				expect(result.OPTIMIZATION?.poly).toBe('50000');
			});

			it('should return highQuality preset parameters', () => {
				const result = buildModelOpsParameters('preset', 'highQuality');
				expect(result).toEqual(OPTIMIZATION_PRESETS.highQuality);
				expect(result.DRACO_COMPRESSION?.enabled).toBe('false');
				expect(result.OPTIMIZATION?.poly).toBe('100000');
			});

			it('should return mobile preset parameters', () => {
				const result = buildModelOpsParameters('preset', 'mobile');
				expect(result).toEqual(OPTIMIZATION_PRESETS.mobile);
				expect(result.OPTIMIZATION?.poly).toBe('25000');
				expect(result.TEXTURE_COMPRESSION?.maxDimension).toBe('1024');
			});

			it('should return preserveOriginal preset parameters', () => {
				const result = buildModelOpsParameters('preset', 'preserveOriginal');
				expect(result).toEqual(OPTIMIZATION_PRESETS.preserveOriginal);
				expect(result.OPTIMIZATION?.desiredOutput).toBe('AUTO');
			});

			it('should default to webOptimized for unknown preset', () => {
				const result = buildModelOpsParameters('preset', 'unknownPreset' as any);
				expect(result).toEqual(OPTIMIZATION_PRESETS.webOptimized);
			});

			it('should default to webOptimized when preset is undefined', () => {
				const result = buildModelOpsParameters('preset', undefined);
				expect(result).toEqual(OPTIMIZATION_PRESETS.webOptimized);
			});
		});

		describe('advanced mode', () => {
			it('should return webOptimized when advancedSettings is undefined', () => {
				const result = buildModelOpsParameters('advanced', undefined, undefined);
				expect(result).toEqual(OPTIMIZATION_PRESETS.webOptimized);
			});

			it('should build parameters from advanced settings', () => {
				const advancedSettings: IDataObject = {
					enableDracoCompression: true,
					targetPolygonCount: 75000,
					forcePolygonCount: true,
					removeObstructedGeometry: true,
					bakeSmallFeatures: false,
					maxTextureResolution: 4096,
					textureCompressionAggression: 5,
					losslessTextureCompression: false,
					useKTX2Format: true,
					bakeAmbientOcclusion: true,
					aoStrength: 2,
					aoRadius: 10,
					aoResolution: 2048,
					pivotPoint: 'center',
				};

				const result = buildModelOpsParameters('advanced', undefined, advancedSettings);

				expect(result.DRACO_COMPRESSION?.enabled).toBe('true');
				expect(result.OPTIMIZATION?.poly).toBe('75000');
				expect(result.OPTIMIZATION?.forcePoly).toBe('true');
				expect(result.OPTIMIZATION?.obstructedGeometry).toBe('true');
				expect(result.OPTIMIZATION?.bakeSmallFeatures).toBe('false');
				expect(result.TEXTURE_COMPRESSION?.maxDimension).toBe('4096');
				expect(result.TEXTURE_COMPRESSION?.aggression).toBe('5');
				expect(result.TEXTURE_COMPRESSION?.lossless).toBe('false');
				expect(result.TEXTURE_COMPRESSION?.ktx2).toBe('true');
				expect(result.AMBIENT_OCCLUSION?.bake).toBe('true');
				expect(result.AMBIENT_OCCLUSION?.strength).toBe('2');
				expect(result.AMBIENT_OCCLUSION?.radius).toBe('10');
				expect(result.AMBIENT_OCCLUSION?.resolution).toBe('2048');
				expect(result.PIVOT_POINT?.pivot).toBe('center');
			});

			it('should use default values when advanced settings are partial', () => {
				const advancedSettings: IDataObject = {
					enableDracoCompression: false,
				};

				const result = buildModelOpsParameters('advanced', undefined, advancedSettings);

				expect(result.DRACO_COMPRESSION?.enabled).toBe('false');
				expect(result.OPTIMIZATION?.poly).toBe('50000'); // default
				expect(result.TEXTURE_COMPRESSION?.maxDimension).toBe('2048'); // default
				expect(result.PIVOT_POINT?.pivot).toBe('bottom-center'); // default
			});

			it('should set ambient occlusion bake to false when disabled', () => {
				const advancedSettings: IDataObject = {
					bakeAmbientOcclusion: false,
				};

				const result = buildModelOpsParameters('advanced', undefined, advancedSettings);

				expect(result.AMBIENT_OCCLUSION?.bake).toBe('false');
				expect(result.AMBIENT_OCCLUSION?.strength).toBeUndefined();
			});
		});
	});

	describe('validateBinaryData', () => {
		let mockExecuteFunctions: IExecuteFunctions;

		beforeEach(() => {
			mockExecuteFunctions = createMockExecuteFunctions();
		});

		describe('file size validation', () => {
			it('should not throw for valid file size', () => {
				const buffer = Buffer.alloc(1024); // 1KB
				expect(() => {
					validateBinaryData(mockExecuteFunctions, buffer, 'test.glb', 'model/gltf-binary');
				}).not.toThrow();
			});

			it('should throw for empty file', () => {
				const buffer = Buffer.alloc(0);
				expect(() => {
					validateBinaryData(mockExecuteFunctions, buffer, 'test.glb', 'model/gltf-binary');
				}).toThrow('File is empty');
			});

			it('should throw for file exceeding max size', () => {
				// Create a mock that pretends to be larger than 30GB
				const buffer = {
					length: 31 * 1024 * 1024 * 1024, // 31GB
				} as Buffer;
				expect(() => {
					validateBinaryData(mockExecuteFunctions, buffer, 'test.glb', 'model/gltf-binary');
				}).toThrow(/exceeds maximum allowed size/);
			});
		});

		describe('filename validation', () => {
			it('should not throw for valid filename', () => {
				const buffer = Buffer.alloc(1024);
				expect(() => {
					validateBinaryData(mockExecuteFunctions, buffer, 'my-model.glb', 'model/gltf-binary');
				}).not.toThrow();
			});

			it('should throw for path traversal attempt', () => {
				const buffer = Buffer.alloc(1024);
				expect(() => {
					validateBinaryData(mockExecuteFunctions, buffer, '../../../etc/passwd', 'application/octet-stream');
				}).toThrow('Invalid filename: contains disallowed characters or patterns');
			});

			it('should throw for null byte in filename', () => {
				const buffer = Buffer.alloc(1024);
				expect(() => {
					validateBinaryData(mockExecuteFunctions, buffer, 'test\x00.glb', 'model/gltf-binary');
				}).toThrow('Invalid filename: contains disallowed characters or patterns');
			});

			it('should throw for absolute path (Unix)', () => {
				const buffer = Buffer.alloc(1024);
				expect(() => {
					validateBinaryData(mockExecuteFunctions, buffer, '/etc/passwd', 'application/octet-stream');
				}).toThrow('Invalid filename: contains disallowed characters or patterns');
			});

			it('should throw for Windows special characters', () => {
				const buffer = Buffer.alloc(1024);
				expect(() => {
					validateBinaryData(mockExecuteFunctions, buffer, 'test<file>.glb', 'model/gltf-binary');
				}).toThrow('Invalid filename: contains disallowed characters or patterns');
			});

			it('should throw for dot-only filename', () => {
				const buffer = Buffer.alloc(1024);
				expect(() => {
					validateBinaryData(mockExecuteFunctions, buffer, '..', 'application/octet-stream');
				}).toThrow('Invalid filename: contains disallowed characters or patterns');
			});
		});

		describe('MIME type validation', () => {
			it('should not throw for valid 3D MIME type', () => {
				const buffer = Buffer.alloc(1024);
				expect(() => {
					validateBinaryData(mockExecuteFunctions, buffer, 'test.glb', 'model/gltf-binary', 'THREE_D');
				}).not.toThrow();
			});

			it('should throw for invalid 3D MIME type', () => {
				const buffer = Buffer.alloc(1024);
				expect(() => {
					validateBinaryData(mockExecuteFunctions, buffer, 'test.png', 'image/png', 'THREE_D');
				}).toThrow(/Invalid content type 'image\/png' for asset type 'THREE_D'/);
			});

			it('should not throw for valid image MIME type', () => {
				const buffer = Buffer.alloc(1024);
				expect(() => {
					validateBinaryData(mockExecuteFunctions, buffer, 'test.png', 'image/png', 'IMAGE');
				}).not.toThrow();
			});

			it('should throw for invalid image MIME type', () => {
				const buffer = Buffer.alloc(1024);
				expect(() => {
					validateBinaryData(mockExecuteFunctions, buffer, 'test.glb', 'model/gltf-binary', 'IMAGE');
				}).toThrow(/Invalid content type/);
			});

			it('should not validate MIME type when assetType is not provided', () => {
				const buffer = Buffer.alloc(1024);
				expect(() => {
					validateBinaryData(mockExecuteFunctions, buffer, 'test.glb', 'application/weird-type');
				}).not.toThrow();
			});

			it('should allow application/octet-stream for 3D assets', () => {
				const buffer = Buffer.alloc(1024);
				expect(() => {
					validateBinaryData(mockExecuteFunctions, buffer, 'test.glb', 'application/octet-stream', 'THREE_D');
				}).not.toThrow();
			});
		});
	});

	describe('sanitizeFileName', () => {
		it('should return filename unchanged when valid', () => {
			expect(sanitizeFileName('my-model.glb')).toBe('my-model.glb');
		});

		it('should remove path traversal sequences', () => {
			// The function removes path components first, then .. sequences
			// So '../../../etc/passwd' becomes 'passwd' (last path segment)
			expect(sanitizeFileName('../../../etc/passwd')).toBe('passwd');
		});

		it('should remove null bytes', () => {
			expect(sanitizeFileName('test\x00file.glb')).toBe('testfile.glb');
		});

		it('should replace Windows invalid characters', () => {
			expect(sanitizeFileName('test<file>:name.glb')).toBe('test_file__name.glb');
		});

		it('should remove leading dots', () => {
			expect(sanitizeFileName('...hidden.txt')).toBe('hidden.txt');
		});

		it('should extract filename from path', () => {
			expect(sanitizeFileName('/path/to/file.glb')).toBe('file.glb');
			expect(sanitizeFileName('C:\\Users\\test\\file.glb')).toBe('file.glb');
		});

		it('should return default filename for empty result', () => {
			expect(sanitizeFileName('...')).toBe('unnamed_file');
			expect(sanitizeFileName('')).toBe('unnamed_file');
		});

		it('should truncate overly long filenames', () => {
			const longName = 'a'.repeat(300) + '.glb';
			const result = sanitizeFileName(longName);
			expect(result.length).toBeLessThanOrEqual(255);
			expect(result.endsWith('.glb')).toBe(true);
		});

		it('should preserve file extension when truncating', () => {
			const longName = 'a'.repeat(260) + '.gltf';
			const result = sanitizeFileName(longName);
			expect(result.endsWith('.gltf')).toBe(true);
			expect(result.length).toBe(255);
		});
	});

	describe('clearTokenCache', () => {
		beforeEach(() => {
			// Clear the cache before each test
			clearTokenCache();
		});

		it('should clear all tokens when called without arguments', () => {
			// This is a simple test to ensure the function doesn't throw
			expect(() => clearTokenCache()).not.toThrow();
		});

		it('should clear specific credential cache when email and org are provided', () => {
			// This is a simple test to ensure the function doesn't throw
			expect(() => clearTokenCache('test@example.com', 'org-uuid')).not.toThrow();
		});

		it('should not throw when clearing non-existent cache entry', () => {
			expect(() => clearTokenCache('nonexistent@example.com', 'nonexistent-org')).not.toThrow();
		});
	});

	describe('OPTIMIZATION_PRESETS', () => {
		it('should have all expected presets defined', () => {
			expect(OPTIMIZATION_PRESETS).toHaveProperty('webOptimized');
			expect(OPTIMIZATION_PRESETS).toHaveProperty('highQuality');
			expect(OPTIMIZATION_PRESETS).toHaveProperty('mobile');
			expect(OPTIMIZATION_PRESETS).toHaveProperty('preserveOriginal');
		});

		it('should have Draco compression enabled for webOptimized', () => {
			expect(OPTIMIZATION_PRESETS.webOptimized.DRACO_COMPRESSION?.enabled).toBe('true');
		});

		it('should have Draco compression disabled for highQuality', () => {
			expect(OPTIMIZATION_PRESETS.highQuality.DRACO_COMPRESSION?.enabled).toBe('false');
		});

		it('should have smaller polygon count for mobile', () => {
			const mobilePolys = parseInt(OPTIMIZATION_PRESETS.mobile.OPTIMIZATION?.poly || '0', 10);
			const webPolys = parseInt(OPTIMIZATION_PRESETS.webOptimized.OPTIMIZATION?.poly || '0', 10);
			expect(mobilePolys).toBeLessThan(webPolys);
		});
	});

	describe('validateCredentials', () => {
		it('should return validated credentials for valid input', () => {
			const creds: IDataObject = {
				email: 'test@example.com',
				password: 'pass123',
				organizationUuid: 'uuid-123',
			};
			const result = validateCredentials(creds);
			expect(result.email).toBe('test@example.com');
			expect(result.password).toBe('pass123');
			expect(result.organizationUuid).toBe('uuid-123');
		});

		it('should include optional fields when provided', () => {
			const creds: IDataObject = {
				email: 'test@example.com',
				password: 'pass123',
				organizationUuid: 'uuid-123',
				defaultClientUuid: 'client-uuid',
				baseUrl: 'https://custom.api.com',
			};
			const result = validateCredentials(creds);
			expect(result.defaultClientUuid).toBe('client-uuid');
			expect(result.baseUrl).toBe('https://custom.api.com');
		});

		it('should throw for missing email', () => {
			const creds: IDataObject = { password: 'pass', organizationUuid: 'uuid-123' };
			expect(() => validateCredentials(creds)).toThrow('email');
		});

		it('should throw for missing password', () => {
			const creds: IDataObject = { email: 'test@example.com', organizationUuid: 'uuid-123' };
			expect(() => validateCredentials(creds)).toThrow('password');
		});

		it('should throw for missing organizationUuid', () => {
			const creds: IDataObject = { email: 'test@example.com', password: 'pass' };
			expect(() => validateCredentials(creds)).toThrow('organizationUuid');
		});

		it('should throw for empty email string', () => {
			const creds: IDataObject = { email: '', password: 'pass', organizationUuid: 'uuid' };
			expect(() => validateCredentials(creds)).toThrow('email');
		});
	});

	describe('parseCommaSeparatedList', () => {
		it('should parse comma-separated string', () => {
			expect(parseCommaSeparatedList('a, b, c')).toEqual(['a', 'b', 'c']);
		});

		it('should handle string without spaces', () => {
			expect(parseCommaSeparatedList('uuid1,uuid2,uuid3')).toEqual(['uuid1', 'uuid2', 'uuid3']);
		});

		it('should handle empty values in string', () => {
			expect(parseCommaSeparatedList('a,,b')).toEqual(['a', 'b']);
		});

		it('should handle single value', () => {
			expect(parseCommaSeparatedList('single')).toEqual(['single']);
		});

		it('should return empty array for null', () => {
			expect(parseCommaSeparatedList(null)).toEqual([]);
		});

		it('should return empty array for undefined', () => {
			expect(parseCommaSeparatedList(undefined)).toEqual([]);
		});

		it('should return empty array for number', () => {
			expect(parseCommaSeparatedList(123)).toEqual([]);
		});

		it('should handle array input', () => {
			expect(parseCommaSeparatedList(['a', 'b', 'c'])).toEqual(['a', 'b', 'c']);
		});

		it('should filter empty strings from array', () => {
			expect(parseCommaSeparatedList(['a', '', 'b', '   '])).toEqual(['a', 'b']);
		});

		it('should return empty array for empty string', () => {
			expect(parseCommaSeparatedList('')).toEqual([]);
		});

		it('should return empty array for whitespace-only string', () => {
			expect(parseCommaSeparatedList('   ')).toEqual([]);
		});
	});

	describe('isGridResponse', () => {
		it('should return true for valid grid response', () => {
			const response = { grid: [{ id: 1 }, { id: 2 }], totalCount: 2 };
			expect(isGridResponse(response)).toBe(true);
		});

		it('should return true for empty grid', () => {
			const response = { grid: [], totalCount: 0 };
			expect(isGridResponse(response)).toBe(true);
		});

		it('should return false for null', () => {
			expect(isGridResponse(null)).toBe(false);
		});

		it('should return false for undefined', () => {
			expect(isGridResponse(undefined)).toBe(false);
		});

		it('should return false for object without grid', () => {
			expect(isGridResponse({ items: [] })).toBe(false);
		});

		it('should return false for non-array grid', () => {
			expect(isGridResponse({ grid: 'not an array' })).toBe(false);
		});

		it('should return true even without totalCount', () => {
			const response = { grid: [] };
			expect(isGridResponse(response)).toBe(true);
		});
	});
});

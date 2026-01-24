/**
 * Binary fixture exports for tests
 */
import { readFileSync } from 'fs';
import { resolve } from 'path';

const FIXTURES_DIR = __dirname;

/**
 * Load a test GLB model
 */
export function getTestGlb(): Buffer {
	return readFileSync(resolve(FIXTURES_DIR, 'test-model.glb'));
}

/**
 * Load a test PNG image
 */
export function getTestPng(): Buffer {
	return readFileSync(resolve(FIXTURES_DIR, 'test-image.png'));
}

/**
 * Load a test PDF document
 */
export function getTestPdf(): Buffer {
	return readFileSync(resolve(FIXTURES_DIR, 'test-document.pdf'));
}

/**
 * Fixture metadata
 */
export const fixtures = {
	glb: {
		path: resolve(FIXTURES_DIR, 'test-model.glb'),
		fileName: 'test-model.glb',
		mimeType: 'model/gltf-binary',
	},
	png: {
		path: resolve(FIXTURES_DIR, 'test-image.png'),
		fileName: 'test-image.png',
		mimeType: 'image/png',
	},
	pdf: {
		path: resolve(FIXTURES_DIR, 'test-document.pdf'),
		fileName: 'test-document.pdf',
		mimeType: 'application/pdf',
	},
};

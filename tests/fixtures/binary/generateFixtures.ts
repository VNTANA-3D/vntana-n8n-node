/**
 * Generate minimal binary test fixtures
 *
 * Run with: npx ts-node tests/fixtures/binary/generateFixtures.ts
 */
import { writeFileSync } from 'fs';
import { resolve } from 'path';

const FIXTURES_DIR = __dirname;

/**
 * Generate a minimal valid GLB file
 * GLB format: 12-byte header + JSON chunk + (optional) binary chunk
 */
function generateMinimalGlb(): Buffer {
	// Minimal glTF JSON content
	const json = JSON.stringify({
		asset: { version: '2.0', generator: 'VNTANA n8n node test' },
		scene: 0,
		scenes: [{ nodes: [0] }],
		nodes: [{ mesh: 0, name: 'TestMesh' }],
		meshes: [{
			primitives: [{
				attributes: { POSITION: 0 },
				mode: 4, // TRIANGLES
			}],
		}],
		accessors: [{
			bufferView: 0,
			componentType: 5126, // FLOAT
			count: 3,
			type: 'VEC3',
			max: [1, 1, 0],
			min: [-1, -1, 0],
		}],
		bufferViews: [{
			buffer: 0,
			byteLength: 36,
			target: 34962, // ARRAY_BUFFER
		}],
		buffers: [{
			byteLength: 36,
		}],
	});

	// Pad JSON to 4-byte boundary
	const jsonPadded = json + ' '.repeat((4 - (json.length % 4)) % 4);
	const jsonBuffer = Buffer.from(jsonPadded, 'utf8');

	// Binary data: 3 vertices (9 floats = 36 bytes)
	// Simple triangle at z=0
	const vertices = new Float32Array([
		-1, -1, 0,  // vertex 0
		 1, -1, 0,  // vertex 1
		 0,  1, 0,  // vertex 2
	]);
	const binBuffer = Buffer.from(vertices.buffer);

	// GLB structure
	const glbMagic = 0x46546C67; // "glTF"
	const glbVersion = 2;
	const jsonChunkType = 0x4E4F534A; // "JSON"
	const binChunkType = 0x004E4942; // "BIN\0"

	const jsonChunkLength = jsonBuffer.length;
	const binChunkLength = binBuffer.length;
	const totalLength = 12 + 8 + jsonChunkLength + 8 + binChunkLength;

	const glb = Buffer.alloc(totalLength);
	let offset = 0;

	// Header (12 bytes)
	glb.writeUInt32LE(glbMagic, offset); offset += 4;
	glb.writeUInt32LE(glbVersion, offset); offset += 4;
	glb.writeUInt32LE(totalLength, offset); offset += 4;

	// JSON chunk header (8 bytes)
	glb.writeUInt32LE(jsonChunkLength, offset); offset += 4;
	glb.writeUInt32LE(jsonChunkType, offset); offset += 4;

	// JSON chunk data
	jsonBuffer.copy(glb, offset); offset += jsonChunkLength;

	// Binary chunk header (8 bytes)
	glb.writeUInt32LE(binChunkLength, offset); offset += 4;
	glb.writeUInt32LE(binChunkType, offset); offset += 4;

	// Binary chunk data
	binBuffer.copy(glb, offset);

	return glb;
}

/**
 * Generate a minimal valid PNG file
 * A 1x1 red pixel PNG
 */
function generateMinimalPng(): Buffer {
	// PNG signature
	const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

	// IHDR chunk (image header)
	const ihdrData = Buffer.alloc(13);
	ihdrData.writeUInt32BE(1, 0);  // width
	ihdrData.writeUInt32BE(1, 4);  // height
	ihdrData.writeUInt8(8, 8);     // bit depth
	ihdrData.writeUInt8(2, 9);     // color type (RGB)
	ihdrData.writeUInt8(0, 10);    // compression
	ihdrData.writeUInt8(0, 11);    // filter
	ihdrData.writeUInt8(0, 12);    // interlace

	const ihdr = createPngChunk('IHDR', ihdrData);

	// IDAT chunk (image data)
	// zlib compressed: filter byte (0) + RGB pixel (255, 0, 0) = red
	// This is a pre-computed zlib-compressed version
	const idatData = Buffer.from([
		0x78, 0x9c, 0x62, 0xf8, 0xcf, 0xc0, 0xc0, 0x00,
		0x00, 0x03, 0x01, 0x01, 0x00,
	]);
	const idat = createPngChunk('IDAT', idatData);

	// IEND chunk (image end)
	const iend = createPngChunk('IEND', Buffer.alloc(0));

	return Buffer.concat([signature, ihdr, idat, iend]);
}

/**
 * Create a PNG chunk with CRC
 */
function createPngChunk(type: string, data: Buffer): Buffer {
	const typeBuffer = Buffer.from(type, 'ascii');
	const length = Buffer.alloc(4);
	length.writeUInt32BE(data.length, 0);

	const crcInput = Buffer.concat([typeBuffer, data]);
	const crc = crc32(crcInput);
	const crcBuffer = Buffer.alloc(4);
	crcBuffer.writeUInt32BE(crc >>> 0, 0);

	return Buffer.concat([length, typeBuffer, data, crcBuffer]);
}

/**
 * Calculate CRC32 for PNG chunks
 */
function crc32(buffer: Buffer): number {
	const table = makeCrcTable();
	let crc = 0xFFFFFFFF;
	for (let i = 0; i < buffer.length; i++) {
		crc = table[(crc ^ buffer[i]) & 0xFF] ^ (crc >>> 8);
	}
	return crc ^ 0xFFFFFFFF;
}

function makeCrcTable(): number[] {
	const table: number[] = [];
	for (let i = 0; i < 256; i++) {
		let c = i;
		for (let j = 0; j < 8; j++) {
			c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
		}
		table[i] = c;
	}
	return table;
}

/**
 * Generate a minimal valid PDF file
 */
function generateMinimalPdf(): Buffer {
	const pdf = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R >>
endobj
4 0 obj
<< /Length 44 >>
stream
BT
/F1 12 Tf
100 700 Td
(Test) Tj
ET
endstream
endobj
xref
0 5
0000000000 65535 f
0000000009 00000 n
0000000058 00000 n
0000000115 00000 n
0000000206 00000 n
trailer
<< /Size 5 /Root 1 0 R >>
startxref
300
%%EOF`;

	return Buffer.from(pdf, 'utf8');
}

// Generate and write fixtures
function main() {
	console.log('Generating test fixtures...');

	// GLB file
	const glb = generateMinimalGlb();
	writeFileSync(resolve(FIXTURES_DIR, 'test-model.glb'), glb);
	console.log(`Created test-model.glb (${glb.length} bytes)`);

	// PNG file
	const png = generateMinimalPng();
	writeFileSync(resolve(FIXTURES_DIR, 'test-image.png'), png);
	console.log(`Created test-image.png (${png.length} bytes)`);

	// PDF file
	const pdf = generateMinimalPdf();
	writeFileSync(resolve(FIXTURES_DIR, 'test-document.pdf'), pdf);
	console.log(`Created test-document.pdf (${pdf.length} bytes)`);

	console.log('Done!');
}

main();

// Export for use in tests
export { generateMinimalGlb, generateMinimalPng, generateMinimalPdf };

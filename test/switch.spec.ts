import { expect } from 'chai';
import { activate, deactivate } from '../src/bootstrap/switch.js';
import { fileURLToPath } from 'node:url';

describe('Switching proxy', function () {
	it('should use a fake fs when activated', async function () {
		const mod = await import('node:fs');
		const fs = mod.default;
		const existsSync = mod.existsSync;
		try {
			activate();
			// If this is a fake fs, then the test file we are curently running should not be present
			expect(existsSync(fileURLToPath(import.meta.url)), 'named export').to.be.false;
			expect(fs.existsSync(fileURLToPath(import.meta.url)), 'default export').to.be.false;
		} finally {
			deactivate();
		}
	});

	it('should use the real fs when deactivated', async function () {
		activate();
		const mod = await import('node:fs');
		const fs = mod.default;
		const existsSync = mod.existsSync;
		deactivate();
		
		// If this is the real fs, then surely the test file we are currently running should exist
		expect(existsSync(fileURLToPath(import.meta.url)), 'named export').to.be.true;
		expect(fs.existsSync(fileURLToPath(import.meta.url)), 'default export').to.be.true;
	});
});

import { expect } from 'chai';
import { activate, deactivate } from '../src/bootstrap/switch.js';
import { fileURLToPath } from 'node:url';

describe('Switching proxy', function () {
	it('should use a fake fs when activated', async function () {
		const fs = (await import('node:fs')).default;
		try {
			activate();
			// If this is a fake fs, then the test file we are curently running should not be present
			return expect(fs.existsSync(fileURLToPath(import.meta.url))).to.be.false;
		} finally {
			deactivate();
		}
	});

	it('should use the real fs when deactivated', async function () {
		deactivate();
		const fs = (await import('node:fs')).default;
		// If this is the real fs, then surely the test file we are currently running should exist
		return expect(fs.existsSync(fileURLToPath(import.meta.url))).to.be.true;
	});
});

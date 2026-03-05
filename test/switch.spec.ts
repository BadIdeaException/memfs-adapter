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

	it('should share a fake fs across module instances', async function() {
		// This test checks that switcher state is shared across module instances.
		// It forcibly loads a second instance of the switcher module.
		// It then makes sure that the two loaded modules are, in fact, different.
		// It then checks that the return result of activating on the one module and subsequently deactivating
		// on the other module are identical. (This takes advantage of the fact that activate() returns the newly
		// activated file system, and deactivate() returns the deactivated file system.)
		const modA = await import('../src/bootstrap/switch.js');
		// @ts-expect-error: Cannot find module fs?cache-bust
		const modB = await import('../src/bootstrap/switch.js?cache-bust');

		
		// The imported modules should not be strictly equal
		expect(modA).to.not.equal(modB);
		try {
			const fs = modA.activate();
			expect(modB.deactivate()).to.equal(fs);
		} finally {
			// Make sure we don't leave modA activated if state is NOT shared.
			modA.deactivate();
		}
	});
});

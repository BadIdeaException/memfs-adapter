// Tap into the module resolution process and intercept any request for fs (or node:fs).
// These will be resolved to our switch module instead, giving us control over whether
// the real or the fake fs is used.
import type { ResolveHook } from 'node:module';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const resolve: ResolveHook = async function resolve(specifier, context, nextResolve) {
	// Allow the import done by the switch to get the real fs module.
	if (specifier === 'fs?memfs-adapter-import') return nextResolve('node:fs', context);

	const path: string = fileURLToPath(import.meta.url);
	const dir: string = dirname(path);
	switch (specifier) {
		case 'fs':
		case 'node:fs':
			specifier = join(dir, 'fs-base.js');
			break;
		case 'fs/promises':
		case 'node:fs/promises':
			specifier = join(dir, 'fs-promises.js');
	}

	return nextResolve(specifier, context);
};

export { resolve };

// switch.js exports an fs-like object, but gives us control over whether this is the actual fs or the memfs.

// Import the real fs module. Note the query part - this will indicate to our custom loader not to replace this
// import with the switch.

// @ts-expect-error: Cannot find module fs?memfs-adapter-import
import real from 'fs?memfs-adapter-import';
// @ts-expect-error: Cannot find module fs?memfs-adapter-import
import type fs from 'fs?memfs-adapter-import';
import { Volume, createFsFromVolume } from 'memfs';

// Currently active file system
let active: fs = real;

// The "fs" object exported from our switch. It is just a proxy over the real fs,
// which diverts method calls to the fake when active.
export const fs = new Proxy<fs>(real, {
	get(target, prop) {
		return active[prop];
	},
	ownKeys(target) {
		return Reflect.ownKeys(active);
	},
	getOwnPropertyDescriptor(target, prop) {
		return Reflect.getOwnPropertyDescriptor(active, prop);
	}
});

export const promises = new Proxy<fs.promises>(real.promises, {
	get(target, prop) {
		return active.promises[prop];
	},
	ownKeys(target) {
		return Reflect.ownKeys(active.promises);
	},
	getOwnPropertyDescriptor(target, prop) {
		return Reflect.getOwnPropertyDescriptor(active.promises, prop);
	}
});

// Activate the fake fs.
export function activate(fake?: fs): fs {
	fake ??= createFsFromVolume(new Volume());
	active = fake;
	return active;
}

// Deactive the fake fs/reactivate the real one.
export function deactivate(): fs {
	const previous: fs = active;
	active = real;
	return previous;
}
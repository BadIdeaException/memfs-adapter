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

export let F_OK = real.F_OK;
export let R_OK = real.R_OK;
export let W_OK = real.W_OK;
export let X_OK = real.X_OK;
export let constants = real.constants;
export let Stats = real.Stats;
export let Dir = real.Dir;
export let Dirent = real.Dirent;
export let ReadStream = real.ReadStream;
export let WriteStream = real.WriteStream;

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

function updateConstants(): void {
	F_OK = active.F_OK;
	R_OK = active.R_OK;
	W_OK = active.W_OK;
	X_OK = active.X_OK;
	constants = active.constants;
	Stats = active.Stats;
	Dir = active.Dir;
	Dirent = active.Dirent;
	ReadStream = active.ReadStream;
	WriteStream = active.WriteStream;
}

// Activate the fake fs.
export function activate(fake?: fs): fs {
	fake ??= createFsFromVolume(new Volume());
	active = fake;
	updateConstants();
	return active;
}

// Deactive the fake fs/reactivate the real one.
export function deactivate(): fs {
	const previous: fs = active;
	active = real;
	updateConstants();
	return previous;
}
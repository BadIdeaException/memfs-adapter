// switch.js exports an fs-like object, but gives us control over whether this is the actual fs or the memfs.

// Import the real fs module. Note the query part - this will indicate to our custom loader not to replace this
// import with the switch.
// @ts-expect-error: Cannot find module fs?mock-fs-reborn-import
import real from 'fs?mock-fs-reborn-import';
// @ts-expect-error: Cannot find module fs?mock-fs-reborn-import
import type fs from 'fs?mock-fs-reborn-import';
import { Volume, createFsFromVolume } from 'memfs';

// Set up global state.
//
// We can't just use a module-local variable, because it leads to difficult-to-trace bugs in instances where the
// module gets loaded more than once. Theoretically that shouldn't happen anyway, but in practice it can when
// tools introduce their own resolution chains (e.g. tsx)
// We will play it extra safe here for a better developer experience when using this module.
const ACTIVE: unique symbol = Symbol.for('mock-fs-reborn:active');
type GlobalState = {
	[ACTIVE]: fs;
};

export let constants = real.constants;
export let Stats = real.Stats;
export let Dir = real.Dir;
export let Dirent = real.Dirent;
export let ReadStream = real.ReadStream;
export let WriteStream = real.WriteStream;

// Convenience function to access currently active file system
function active(): fs {
	return (globalThis as typeof globalThis & GlobalState)[ACTIVE];
}

// The "fs" object exported from our switch. It is just a proxy over the real fs,
// which diverts method calls to the fake when active.
export const fs = new Proxy<fs>(real, {
	get(target, prop) {
		return active()[prop];
	},
	ownKeys(target) {
		return Reflect.ownKeys(active());
	},
	getOwnPropertyDescriptor(target, prop) {
		return Reflect.getOwnPropertyDescriptor(active(), prop);
	}
});

export const promises = new Proxy<fs.promises>(real.promises, {
	get(target, prop) {
		return active().promises[prop];
	},
	ownKeys(target) {
		return Reflect.ownKeys(active().promises);
	},
	getOwnPropertyDescriptor(target, prop) {
		return Reflect.getOwnPropertyDescriptor(active().promises, prop);
	}
});

function updateConstants(): void {
	constants = active().constants;
	Stats = active().Stats;
	Dir = active().Dir;
	Dirent = active().Dirent;
	ReadStream = active().ReadStream;
	WriteStream = active().WriteStream;
}

// Activate the fake fs.
export function activate(fake?: fs): fs {
	fake ??= createFsFromVolume(new Volume());
	(globalThis as typeof globalThis & GlobalState)[ACTIVE] = fake;
	updateConstants();
	return active();
}

// Deactive the fake fs/reactivate the real one.
export function deactivate(): fs {
	const previous: fs = active();
	(globalThis as typeof globalThis & GlobalState)[ACTIVE] = real;
	updateConstants();
	return previous;
}

// Initialize currently active file system
deactivate();

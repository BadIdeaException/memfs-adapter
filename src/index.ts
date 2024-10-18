import { activate, deactivate } from './bootstrap/switch.js';
import {
	fileFactory,
	directoryFactory,
	symlinkFactory,
	loaderFactory,
	File,
	Directory,
	Symlink,
	DirectoryLiteral,
	FileLiteral,
	FileFactory,
	DirectoryOptions,
	DirectoryFactory,
	SymlinkFactory,
	LoaderFactory,
	isFile,
	isDirectory,
	isSymlink,
	isFactory,
	isLoader
} from './items.js';
import type MockFs from 'mock-fs/lib/filesystem.js';

import os from 'node:os';
import flatten from './flatten.js';
import path from 'node:path';
import bypass from './bypass.js';

function createUnknownKindError(item: any, filename: string): Error {
	const kind: string =
		typeof item === 'object' && item !== null
			? item.constructor.name
			: item === null
				? 'null'
				: typeof item;

	return new TypeError(`Unknown kind ${kind} for item ${filename}`);
}

function adapter(config: DirectoryLiteral = {}, options?: MockFs.Options): void {
	options = Object.assign({}, { createCwd: true, createTmp: true }, options);

	// Make a copy so we don't change the passed-in config
	config = Object.assign({}, config);
	if (options.createCwd) config[process.cwd()] ??= {};
	if (options.createTmp) config[os.tmpdir()] ??= {};

	config = flatten(config, '');

	// todo: Pass 1: Execute loaders, amending the config accordingly

	const items: string[] = Object.keys(config).sort();
	const fs = activate();

	// Pass 2: Run forward through all items and create content
	// Because items is sorted, this will ensure parent directories are created before the files they contain.
	for (const filename of items) {
		const item = config[filename];

		if (isFile(item)) {
			const content: FileLiteral = isFactory(item) ? (item.content ?? '') : item;
			fs.writeFileSync(filename, content);
		} else if (isSymlink(item)) {
			// If item.path is a relative path, resolve it relative to the dir containing the symlink:
			const base: string = path.dirname(filename);
			const target: string = path.resolve(base, item.path);

			fs.symlinkSync(target, filename);
		} else if (isDirectory(item)) {
			fs.mkdirSync(filename);
		} else throw createUnknownKindError(item, filename);
	}

	// Pass 3: Run backwards through all items and adjust metadata
	// Because items is sorted, running backwards will ensure containing directories' permissions are only
	// adjusted after the files they contain
	items.reverse();
	for (const filename of items) {
		const item = config[filename];
		if (isFactory(item)) {
			if (isFile(item) || isDirectory(item)) {
				fs.chmodSync(filename, item.mode);
				fs.chownSync(filename, item.uid, item.gid);
				fs.utimesSync(filename, item.atime, item.mtime);
			} else if (isSymlink(item)) {
				fs.lchmodSync(filename, item.mode);
				fs.lchownSync(filename, item.uid, item.gid);
				fs.lutimesSync(filename, item.atime, item.mtime);
			} else throw createUnknownKindError(item, filename);
		}
	}
}

adapter.file = fileFactory;
adapter.directory = directoryFactory;
adapter.symlink = symlinkFactory;
adapter.restore = deactivate;

export default adapter;

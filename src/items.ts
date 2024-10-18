import type MockFs from 'mock-fs/lib/filesystem.js';

export const kind = Symbol('kind');
export type Item = File | Directory | Symlink | Loader;
export type File = FileLiteral | FileFactory;
export type Directory = DirectoryLiteral | DirectoryFactory;
export type Symlink = SymlinkFactory;
export type Loader = LoaderFactory;

export type DirectoryOptions = Omit<MockFs.DirectoryOptions, 'items'> & {
	items?: DirectoryLiteral | undefined;
};

export type Factory = FileFactory | DirectoryFactory | SymlinkFactory | LoaderFactory;
export interface FileFactory extends MockFs.FileOptions {
	[kind]: 'file';
}
export interface DirectoryFactory extends DirectoryOptions {
	[kind]: 'directory';
}
export interface SymlinkFactory extends MockFs.SymlinkOptions {
	[kind]: 'symlink';
}
export interface LoaderFactory extends MockFs.LoaderOptions {
	path: string;
	[kind]: 'loader';
}

export type FileLiteral = Buffer | string;
export interface DirectoryLiteral {
	[index: string]: Item;
}

export function isFactory(item: Item): item is Factory {
	return item instanceof Object && Object.hasOwn(item, kind);
}

export function isFile(item: Item): item is File {
	return (
		typeof item === 'string' ||
		item instanceof Buffer ||
		(isFactory(item) && item[kind] === 'file')
	);
}

export function isDirectory(item: Item): item is Directory {
	return (
		(item instanceof Object && !isFactory(item) && !(item instanceof Buffer)) ||
		(isFactory(item) && item[kind] === 'directory')
	);
}

export function isSymlink(item: Item): item is Symlink {
	return isFactory(item) && item[kind] === 'symlink';
}

export function isLoader(item: Item): item is Loader {
	return isFactory(item) && item[kind] === 'loader';
}

const DEFAULT_PROPERTIES = {
	uid: process.getuid?.call(process),
	gid: process.getgid?.call(process),
	atime: new Date(),
	ctime: new Date(),
	mtime: new Date(),
	birthtime: new Date()
};

export function fileFactory(config: MockFs.FileOptions = {}): FileFactory {
	return Object.assign({}, DEFAULT_PROPERTIES, { mode: 0o666 }, config, {
		[kind]: 'file' as const
	});
}

export function directoryFactory(config: DirectoryOptions): DirectoryFactory {
	return Object.assign({}, DEFAULT_PROPERTIES, { mode: 0o777, items: {} }, config, {
		[kind]: 'directory' as const
	});
}

export function symlinkFactory(config: MockFs.SymlinkOptions): SymlinkFactory {
	return Object.assign({}, DEFAULT_PROPERTIES, { mode: 0o666 }, config, {
		[kind]: 'symlink' as const
	});
}

export function loaderFactory(path: string, options?: MockFs.LoaderOptions): LoaderFactory {
	return Object.assign({}, { path }, options, { [kind]: 'loader' as const });
}

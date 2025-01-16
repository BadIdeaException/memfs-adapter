import { expect } from 'chai';

describe('Module resolution hook', function () {
	const EXPORTS_BASE = [
		'appendFile',
		'appendFileSync',
		'access',
		'accessSync',
		'chown',
		'chownSync',
		'chmod',
		'chmodSync',
		'close',
		'closeSync',
		'copyFile',
		'copyFileSync',
		'cp',
		'cpSync',
		'createReadStream',
		'createWriteStream',
		'exists',
		'existsSync',
		'fchown',
		'fchownSync',
		'fchmod',
		'fchmodSync',
		'fdatasync',
		'fdatasyncSync',
		'fstat',
		'fstatSync',
		'fsync',
		'fsyncSync',
		'ftruncate',
		'ftruncateSync',
		'futimes',
		'futimesSync',
		'glob',
		'globSync',
		'lchown',
		'lchownSync',
		'lchmod',
		'lchmodSync',
		'link',
		'linkSync',
		'lstat',
		'lstatSync',
		'lutimes',
		'lutimesSync',
		'mkdir',
		'mkdirSync',
		'mkdtemp',
		'mkdtempSync',
		'open',
		'openSync',
		'openAsBlob',
		'readdir',
		'readdirSync',
		'read',
		'readSync',
		'readv',
		'readvSync',
		'readFile',
		'readFileSync',
		'readlink',
		'readlinkSync',
		'realpath',
		'realpathSync',
		'rename',
		'renameSync',
		'rm',
		'rmSync',
		'rmdir',
		'rmdirSync',
		'stat',
		'statfs',
		'statSync',
		'statfsSync',
		'symlink',
		'symlinkSync',
		'truncate',
		'truncateSync',
		'unwatchFile',
		'unlink',
		'unlinkSync',
		'utimes',
		'utimesSync',
		'watch',
		'watchFile',
		'writeFile',
		'writeFileSync',
		'write',
		'writeSync',
		'writev',
		'writevSync',
		'Dirent',
		'Stats',
		'ReadStream',
		'WriteStream',
		'Dir',
		'opendir',
		'opendirSync',
		'F_OK',
		'R_OK',
		'W_OK',
		'X_OK',
		'constants',
		'promises'
	];
	const EXPORTS_PROMISES = [
		'constants',
		'access',
		'appendFile',
		'chmod',
		'chown',
		'copyFile',
		'cp',
		'lchmod',
		'lchown',
		'lutimes',
		'link',
		'lstat',
		'mkdir',
		'mkdtemp',
		'open',
		'opendir',
		'readdir',
		'readFile',
		'readlink',
		'realpath',
		'rename',
		'rmdir',
		'rm',
		'stat',
		'statfs',
		'symlink',
		'truncate',
		'unlink',
		'utimes',
		'watch',
		'writeFile'
	];

	it('should import the switched-out library', async function () {
		await Promise.all(
			['fs', 'node:fs'].map(async specifier => {
				const imported = await import(specifier);
				const expected = await import('../src/bootstrap/fs-base.js');

				return expect(imported, specifier).to.equal(expected);
			})
		);

		await Promise.all(
			['fs/promises', 'node:fs/promises'].map(async specifier => {
				const imported = await import(specifier);
				const expected = await import('../src/bootstrap/fs-promises.js');

				return expect(imported, specifier).to.equal(expected);
			})
		);
	});

	it('should have default export', async function () {
		const base = await import('../src/bootstrap/fs-base.js');
		expect(base.default).to.exist.and.be.an('object').that.includes.all.keys(EXPORTS_BASE);

		const promises = await import('../src/bootstrap/fs-promises.js');
		expect(promises.default)
			.to.exist.and.be.an('object')
			.that.includes.all.keys(EXPORTS_PROMISES);
	});

	it('should have named exports', async function () {
		const base = await import('../src/bootstrap/fs-base.js');
		expect(base).to.include.all.keys(EXPORTS_BASE);

		const promises = await import('../src/bootstrap/fs-promises.js');
		expect(promises).to.include.all.keys(EXPORTS_PROMISES);
	});

});

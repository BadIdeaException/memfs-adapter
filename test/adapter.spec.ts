import { expect } from 'chai';
import adapter from '../src/index.js';
import fs from 'fs';
import os from 'node:os';
import path from 'node:path';

describe('adapter', function () {
	function factoryBaseTest(factory, isSymlink: boolean = false) {
		const statFn = isSymlink ? 'lstatSync' : 'statSync';
		const target: { '/target': string } | {} = isSymlink ? { '/target': 'abc' } : {};

		it('should set mode', function () {
			const mode = 0o770;
			adapter({ '/test': factory({ mode }), ...target });
			const stats = fs[statFn]('/test');
			expect(stats.mode & 0o777).to.equal(mode);
		});

		it('should set uid and gid', function () {
			const uid = 1;
			const gid = 2;
			adapter({ '/test': factory({ uid, gid }), ...target });
			const stats = fs[statFn]('/test');
			expect(stats.uid).to.equal(uid);
			expect(stats.gid).to.equal(gid);
		});

		it('should set atime and mtime', function () {
			const atime = new Date(1);
			const mtime = new Date(2);
			adapter({ '/test': factory({ atime, mtime }), ...target });
			const stats = fs[statFn]('/test');
			expect(stats.atime).to.deep.equal(atime);
			expect(stats.mtime).to.deep.equal(mtime);
		});

		it('should not set birthtime and ctime', function () {
			if (Date.now() === 0) this.skip();

			const birthtime = new Date(0);
			const ctime = new Date(0);
			adapter({ '/test': factory({ birthtime, ctime }), ...target });
			const stats = fs[statFn]('/test');
			expect(stats.ctime).to.not.equal(ctime);
			expect(stats.birthtime).to.not.equal(birthtime);
		});
	}

	afterEach(adapter.restore);

	it('should create cwd by default or when createCwd is true', function () {
		[{ createCwd: true }, undefined].forEach(options => {
			adapter({}, options);
			const stats = fs.statSync(process.cwd());
			expect(stats.isDirectory()).to.be.true;
		});
	});

	it('should create temp dir by default or when createTmp is true', function () {
		[{ createTmp: true }, undefined].forEach(options => {
			adapter({}, options);
			const stats = fs.statSync(os.tmpdir());
			expect(stats.isDirectory()).to.be.true;
		});
	});

	it('should throw when config includes an unknown type', function () {
		expect(() => {
			// @ts-expect-error: not assignable
			adapter({ a: 0 });
		}).to.throw(/unknown kind.*number/i);
		// Check that null is described as "null" (even though typeof null === 'object')
		expect(() => {
			// @ts-expect-error: not assignable
			adapter({ a: null });
		}).to.throw(/unknown kind.*null/i);
	});

	it('should expand multi-part paths', function () {
		adapter({ '/a/b/test': 'abc' });
		expect(fs.existsSync('/a/b/test')).to.be.true;

		// Check it works when nested, too
		adapter({ '/a': { 'b/test': 'abc' } });
		expect(fs.existsSync('/a/b/test')).to.be.true;
	});

	it('should expand relative paths relative to cwd', function () {
		const cwd = process.cwd();
		const config = { a: 'abc' };
		adapter(config);

		expect(fs.readFileSync(path.resolve(cwd, 'a'), 'utf8')).to.equal('abc');
	});

	it('should expand absolute paths relative to the root', function () {
		adapter({ '/a': 'abc' });
		expect(fs.readFileSync('/a', 'utf8')).to.equal('abc');
	});

	describe('files', function () {
		it('should create files from strings', function () {
			adapter({ '/test': 'abc' });
			expect(fs.readFileSync('/test', 'utf8')).to.equal('abc');
		});

		it('should create files from buffers', function () {
			adapter({ '/test': Buffer.from('abc') });
			expect(fs.readFileSync('/test')).to.deep.equal(Buffer.from('abc'));
		});

		it('should create files from the factory', function () {
			adapter({ '/test': adapter.file({}) });
			expect(fs.existsSync('/test')).to.be.true;
		});

		describe('factory', function () {
			it('should set content', function () {
				['abc', Buffer.from('abc')].forEach(content => {
					adapter({ '/test': adapter.file({ content }) });
					expect(fs.readFileSync('/test', 'utf8')).to.equal('abc');
				});
			});

			factoryBaseTest(adapter.file);
		});
	});

	describe('directories', function () {
		it('should create directories from objects', function () {
			const config = {
				'/test': {}
			};
			adapter(config);
			const stats = fs.statSync('/test');
			expect(stats.isDirectory()).to.be.true;
		});

		it('should create directories from the factory', function () {
			const config = {
				'/test': adapter.directory({})
			};
			adapter(config);
			const stats = fs.statSync('/test');
			expect(stats.isDirectory()).to.be.true;
		});

		it('should create nested items', function () {
			const config = {
				'/a': {
					test: 'abc'
				}
			};
			adapter(config);
			expect(fs.readFileSync('/a/test', 'utf8')).to.equal('abc');
		});

		describe('factory', function () {
			factoryBaseTest(adapter.directory);
		});
	});

	describe('symlinks', function () {
		it('should create symlinks from the factory', function () {
			adapter({
				'/target': 'abc',
				'/test': adapter.symlink({ path: '/target' })
			});
			const stats = fs.lstatSync('/test');
			expect(stats.isSymbolicLink()).to.be.true;
		});

		it('should resolve the target path relative to the root with an absolute path', function () {
			adapter({
				'/target': 'abc',
				'/test': adapter.symlink({ path: '/target' })
			});
			expect(fs.readFileSync('/test', 'utf8')).to.equal('abc');
		});

		it('should resolve the target path relative to the symlink with a relative path', function () {
			adapter({
				'/dir': {
					target: 'abc',
					test: adapter.symlink({ path: 'target' })
				}
			});
			expect(fs.readFileSync('/dir/test', 'utf8')).to.equal('abc');
		});

		factoryBaseTest(config => adapter.symlink({ path: '/target', ...config }), true);
	});

	describe('loading', function () {
		let FIXTURE;
		before(function () {
			const PATH = './test/fixtures';
			FIXTURE = {
				file1: fs.readFileSync(path.join(PATH, 'file1'), 'utf8'),
				file2: fs.readFileSync(path.join(PATH, 'file2'), 'utf8'),
				file3: fs.readFileSync(path.join(PATH, 'directory', 'file3'), 'utf8'),
				file4: fs.readFileSync(path.join(PATH, 'directory', 'file4'), 'utf8'),
				file5: fs.readFileSync(path.join(PATH, 'directory', 'subdir', 'file5'), 'utf8')
			};
		});

		it('should load a file from the real filesystem', function () {
			const PATH = './test/fixtures/file1';
			adapter({ '/test': adapter.load(PATH) });

			expect(fs.readFileSync('/test', 'utf8')).to.equal(FIXTURE.file1);
		});

		it('should load a directory including everything it contains from the real filesystem', function () {
			const PATH = './test/fixtures';

			adapter({ '/test': adapter.load(PATH) });

			expect(fs.readFileSync('/test/file1', 'utf8')).to.equal(FIXTURE.file1);
			expect(fs.readFileSync('/test/file2', 'utf8')).to.equal(FIXTURE.file2);
			expect(fs.readFileSync('/test/directory/file3', 'utf8')).to.equal(FIXTURE.file3);
			expect(fs.readFileSync('/test/directory/file4', 'utf8')).to.equal(FIXTURE.file4);
			expect(fs.readFileSync('/test/directory/subdir/file5', 'utf8')).to.equal(FIXTURE.file5);
		});

		it('should load a directory including only the files it contains from the real filesystem when recursive=false', function () {
			const PATH = './test/fixtures';
			adapter({ '/test': adapter.load(PATH, { recursive: false }) });

			expect(fs.readFileSync('/test/file1', 'utf8')).to.equal(FIXTURE.file1);
			expect(fs.readFileSync('/test/file2', 'utf8')).to.equal(FIXTURE.file2);
			expect(fs.existsSync('/test/directory')).to.be.false;
		});

		it('should duplicate stats', function () {
			const PATH = './test/fixtures/file1';
			const expected = fs.statSync(PATH);

			adapter({ '/test': adapter.load(PATH) });
			const actual = fs.statSync('/test');

			['mode', 'uid', 'gid', 'atime', 'mtime'].forEach(stat => {
				expect(actual[stat]).to.deep.equal(expected[stat]);
			});
		});
	});

	describe('bypass', function () {
		it('should use the real filesystem', function () {
			adapter({});
			expect(adapter.bypass(() => fs.readFileSync('./test/fixtures/file1', 'utf8'))).to.equal(
				'file1'
			);
		});

		it('should return a promise if the operation is async', async function () {
			adapter({});
			const result = adapter.bypass(() =>
				fs.promises.readFile('./test/fixtures/file1', 'utf8')
			);

			expect(result).to.be.a('promise');
			return result; // This allows mocha to wait for the promise to resolve for completion
		});

		it('should re-enable the mock filesystem on completion', function () {
			adapter({ '/test': 'foo' });
			adapter.bypass(() => fs.readFileSync('./test/fixtures/file1', 'utf8'));

			expect(fs.readFileSync('/test', 'utf8')).to.equal('foo');
		});
	});
});

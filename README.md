# memfs-adapter

**This package brings the pleasant interface and ease of use of [mock-fs](https://github.com/tschaub/mock-fs) built on top of the power and futureproofness of [memfs](https://github.com/streamich/memfs).** 

It is designed to be a drop-in replacement for mock-fs (with some [minor caveats](#API)). 

If you want to know more about why this may be a good idea, skip ahead to the [#Motivation] section.

## Usage

Install:

```
npm install --save-dev memfs-adapter
```

Note that this library requires Node.js 20 or later. On the other hand, mock-fs works without problem in Node versions earlier than that, so you probably don't need this library at all then.

Use as you would mock-fs:

```
import mockfs from 'memfs-adapter';
import fs from 'node:fs';

mockfs({ '/foo': 'bar' });

fs.readFileSync('/foo'); // 'bar'
```

When run, make sure that `memfs-adapter/bootstrap` is imported **before** the first import of the `fs` module. This can most reliably be achieved by running your file with the `import` flag: 
```
node --import=memfs-adapter/bootstrap index.js
``` 

Or, with e.g. mocha:

```
mocha --require=memfs-adapter/bootstrap
```

Better yet, you can do this in your [`mocha` configuration file or `package.json`](https://mochajs.org/#configuring-mocha-nodejs):
```
"mocha": {
    "require": "memfs-adapter/bootstrap"
}
```

## API

This package aims to be a drop-in replacement for mock-fs, and in most cases it should be enough to replace your import of mock-fs with it. For how to use, please refer to the [API documentation of mock-fs](https://github.com/tschaub/mock-fs#docs). 

There are, however, some differences:

1. When using [file/directory/symlink factories](https://github.com/tschaub/mock-fs#mockfileproperties), setting `birthtime` and `ctime` is not supported. They are silently ignored. 

2. When loading real files and directories using [`mockfs.load`](https://github.com/tschaub/mock-fs#loading-real-files--directories),  lazy loading is not supported. The `lazy` option is silently ignored. Everything is always loaded eagerly, so be careful when adding large directory trees to your mock configuration. 

## Motivation

So, why re-implement mock-fs's API on top of memfs at all? Why not just use mock-fs?

mock-fs uses a clever trick to achieve what it does: it essentially inserts itself into the seam that exists in Node.js between the Javascript and native parts of the `fs` module. However, access to this feature is being cut off from user land usage, and the maintainers themselves [forecast the project's impending death](https://github.com/tschaub/mock-fs/issues/383). As a result, it has become somewhat brittle, and more and more effort has been required to keep it working with newer Node versions. 

memfs, on the other hand, doesn't have these problems. It completely re-implements all the `fs` methods, from scratch. However, I find the mock-fs API considerably easier to use in testing, because it takes care of replacing the built-in `fs` globally. With memfs, if you want the system under test to be backed by the mock filesystem rather than the real one, you have to take care of making that switch yourself - most commonly using [link seam targeting](https://sinonjs.org/how-to/link-seams-commonjs/) with something like [proxyquire](https://github.com/thlorenz/proxyquire) or [esmock](https://github.com/iambumblehead/esmock). This is not only cumbersome, it can also lead to more trouble down the road. Consider this:

```
import Foo from './foo.js';
import memfs from 'memfs';

it('should be a Foo', async function() {
	// Assume that getAFoo reads some data from disk and turns it into a Foo instance
	const getAFoo = (await esmock('./getafoo.js', {}, {
		fs: memfs.fs
	})).default;

	const foo = getAFoo();

	expect(foo).to.be.an.instanceOf(Foo);
});
```

This will - perhaps surprisingly - not work, because the `Foo` you imported here and the one imported in `getafoo.js` are actually different, and hence the test will fail. 

So, I set out to re-implement the mock-fs API backed by memfs, using a custom loader (or, in new parlance, customization hook), to insert a switching proxy when Node's `fs` module is imported. This proxy presents either the real or the in-memory file system, depending on which one is currently active. Upon activation, the configuration object is translated into a series of ordinary file system calls to populate the in-memory file system.
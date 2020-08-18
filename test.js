const minify = require('.');
const path = require('path');
const fs = require('fs');
const mockFs = require('mock-fs');
const test = require('ava');
const lockfile = require('@yarnpkg/lockfile');

const fixture = filename => 
  fs.readFileSync(path.join(__dirname, 'fixtures', filename));

const withMockFs = (t, contents) => {
  mockFs(contents);
  t.teardown(() => mockFs.restore());
};

test('makes no changes to a simple file', t => {
  const simple = fixture('simple-yarn.lock');
  withMockFs(t, {'yarn.lock': simple});
	minify('yarn.lock');
  const updated = fs.readFileSync('yarn.lock');
  t.deepEqual(updated, simple, 'content did not change');
});

test('writes to an alternative file', t => {
  const simple = fixture('simple-yarn.lock');
  withMockFs(t, {'yarn.lock': simple});
	minify('yarn.lock', {outputFilename: 'yarn.lock-new'});
  const updated = fs.readFileSync('yarn.lock-new');
  t.deepEqual(updated, simple, 'content did not change');
});

test('collapses two requirements that can both be satisifed with one version', t => {
  const simple = fixture('twoversions-yarn.lock');
  withMockFs(t, {'yarn.lock': simple});
	minify('yarn.lock');
  const {object} = lockfile.parse(fs.readFileSync('yarn.lock', 'utf8'));
  t.deepEqual(Object.values(object).map(b => b.version), ['2.0.3', '2.0.3']);
});

test('ignores packages when directed', t => {
  const simple = fixture('twoversions-yarn.lock');
  withMockFs(t, {'yarn.lock': simple});
	minify('yarn.lock', {ignore: pkg => pkg === '@nodelib/fs.stat'});
  const {object} = lockfile.parse(fs.readFileSync('yarn.lock', 'utf8'));
  t.deepEqual(Object.values(object).map(b => b.version).sort(), ['2.0.2', '2.0.3']);
});

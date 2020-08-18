# yarn-minify

This is a tool for "minifying" a `yarn.lock` file, in the sense of eliminating unnecessary use of old versions of packages.

It can be used to work around [yarn's inability to upgrade indirect dependencies](https://github.com/yarnpkg/yarn/issues/4986), for example.

## Explanation

The `yarn.lock` file consists of stanzas listing package requirement strings and the specific package to which those are resolved:

```
ansi-styles@^4.0.0, ansi-styles@^4.1.0, ansi-styles@^4.2.1:
  version "4.2.1"
  resolved "https://registry.yarnpkg.com/ansi-styles/-/ansi-styles-4.2.1.tgz#90ae75c424d008d2624c5bf29ead3177ebfcf359"
  integrity sha512-9VGjrMsG1vePxcSweQsN20KY/c4zN0h9fLjqAbwbPfahM3t+NL+M9HC8xeXG2I8pX5NoamTGNuomEUFI7fcUjA==
  dependencies:
    "@types/color-name" "^1.1.1"
    color-convert "^2.0.1"
```

In this example, there are four different requirements for the `ansi-styles` package.
These might be from the current package's `package.json`, or indirect dependencies of that package.
In any case, in this example all three are satisfied by version `4.2.1`.

However, in some cases, yarn chooses to use different versions to satisfy different requirements, even if this is not necessary.

```
"@hapi/hoek@8.x.x":
  version "8.5.0"
  resolved "https://registry.yarnpkg.com/@hapi/hoek/-/hoek-8.5.0.tgz#2f9ce301c8898e1c3248b0a8564696b24d1a9a5a"
  integrity sha512-7XYT10CZfPsH7j9F1Jmg1+d0ezOux2oM2GfArAzLwWe4mE2Dr3hVjsAL6+TFY49RRJlCdJDMw3nJsLFroTc8Kw==

"@hapi/hoek@^8.3.1":
  version "8.3.2"
  resolved "https://registry.yarnpkg.com/@hapi/hoek/-/hoek-8.3.2.tgz#91e7188edebc5d876f0b91a860f555ff06f0782b"
  integrity sha512-NP5SG4bzix+EtSMtcudp8TvI0lB46mXNo8uFpTDw6tqxGx4z5yx+giIunEFA0Z7oUO4DuWrOJV9xqR2tJVEdyA==
```

It does this intentionally -- it is a "conservative" approach to upgrading dependencies.
In this case, either version 8.5.0 or 8.3.2 could be used to satisfy both requirements.
Instead, *both* versions are installed, increasing the size of `node_modules` and potentially including code with known security vulnerabilities.

The `yarn-minify` library finds these situations and prefers the most recent installed version of the dependency.
In this case, it would produce:

```
"@hapi/hoek@8.x.x", "@hapi/hoek@^8.3.1":
  version "8.5.0"
  resolved "https://registry.yarnpkg.com/@hapi/hoek/-/hoek-8.5.0.tgz#2f9ce301c8898e1c3248b0a8564696b24d1a9a5a"
  integrity sha512-7XYT10CZfPsH7j9F1Jmg1+d0ezOux2oM2GfArAzLwWe4mE2Dr3hVjsAL6+TFY49RRJlCdJDMw3nJsLFroTc8Kw==
```

Note that the library does not make any reference to the package registry, and will not *upgrade* anything.
It merely modifies the `yarn.lock` file in-place.

## Usage

```javascript
const minify = require('yarn-minify');

// just minify the yarn.lock file in the current directory
minify('yarn.lock');

// minify but write to another filename
minify('yarn.lock', {outputFilename: 'yarn.lock-minified'});

// minify but ignore some packages (useful for applying changes one-by-one)
minify('yarn.lock', {
  ignore: pkg => pkg.startsWith('@hapi/'),
});
```

Alternately, from the command line `yarn-minify` will minify a `yarn.lock` in the current working directory:

```shell
$ yarn-minify
$ git diff
```

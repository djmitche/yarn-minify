const fs = require('fs');
const lockfile = require('@yarnpkg/lockfile');
const semver = require('semver');

const minify = (filename, {outputFilename = filename, ignore = package => false} = {}) => {
  const file = fs.readFileSync(filename, 'utf8');

  // despite its README, lockfile returns its data in an `object` property, with a `type`
  // property giving success or failure.
  const {type, object} = lockfile.parse(file); 

  if (type !== 'success') {
    throw new Error(`Could not parse ${filename}`);
  }

  const byPackage = new Map();
  Object.entries(object).forEach(([key, value]) => {
    const [_, package, requirement] = /^(.*)@([^@]*)$/.exec(key);
    const {version} = value;

    let pkg = byPackage.get(package);
    if (!pkg) {
      pkg = {specs: new Map(), requirements: new Set()};
      byPackage.set(package, pkg);
    }

    pkg.specs.set(version, value);
    pkg.requirements.add(requirement);
  });

  // modify the object in-place..
  for (let [package, {specs, requirements}] of byPackage) {
    if (ignore(package)) {
      continue;
    }

    // sort versions from newest to oldest
    const versions = [...specs.keys()];
    versions.sort(semver.rcompare);

    // for each requirement, find the newest of the available versions that
    // will satisfy it
    for (let requirement of requirements) {
      for (let version of versions) {
        if (semver.satisfies(version, requirement)) {
          object[`${package}@${requirement}`] = specs.get(version);
          break;
        }
      }
    }
  }

  fs.writeFileSync(outputFilename || filename, lockfile.stringify(object), 'utf8');
};

minify('/home/dustin/p/taskcluster/yarn.lock', {
  outputFilename: '/home/dustin/p/taskcluster/yarn.lock.new',
  ignore: () => true,
});

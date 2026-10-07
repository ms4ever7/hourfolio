/** @type {import('@expo/fingerprint').Config} */
module.exports = {
  // The runtime version is the fingerprint, and OTA updates only reach builds with the same one.
  // package.json scripts (like update:staging) don't change native code, so they must not count.
  sourceSkips: ['PackageJsonScriptsAll'],
};

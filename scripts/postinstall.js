/**
 * Postinstall script to patch ESM-only dependencies for CJS compatibility.
 *
 * @actions/core v3+ and its transitive dependencies are ESM-only
 * (exports only "import" condition). This script adds a "default"
 * export condition so that CJS bundlers (like @vercel/ncc) and test
 * runners (like Jest/ts-jest) can resolve the packages.
 */
const fs = require('fs')
const path = require('path')

function patchPackage(pkgPath) {
  try {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'))
    if (!pkg.exports) return

    let patched = false
    for (const key of Object.keys(pkg.exports)) {
      const entry = pkg.exports[key]
      if (typeof entry === 'object' && entry['import'] && !entry['default']) {
        entry['default'] = entry['import']
        patched = true
      }
    }

    if (patched) {
      fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n')
      console.log(
        `Patched ${pkg.name}@${pkg.version} exports with "default" condition`
      )
    }
  } catch (e) {
    // Ignore errors - the package might not be installed yet
  }
}

function findPackageJsonFiles(dir) {
  const results = []
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true })
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name)
      if (entry.isDirectory() && entry.name !== '.cache') {
        results.push(...findPackageJsonFiles(fullPath))
      } else if (entry.name === 'package.json') {
        results.push(fullPath)
      }
    }
  } catch (e) {
    // Ignore permission or missing directory errors
  }
  return results
}

const nodeModulesDir = path.join(__dirname, '..', 'node_modules', '@actions')
const packageFiles = findPackageJsonFiles(nodeModulesDir)
for (const pkgPath of packageFiles) {
  patchPackage(pkgPath)
}

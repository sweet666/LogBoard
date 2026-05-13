'use strict';

/**
 * UTAM Compiler Configuration
 *
 * Compiles .utam.json page object descriptors in pageObjects/ into runnable
 * JavaScript modules that WDIO and the UTAM loader can import at runtime.
 *
 * Output goes to __utam__/ (git-ignored) to keep generated files separate
 * from authored sources.
 *
 * Run: npm run build:pageObjects
 * Or:  npx utam -c utam.config.js
 */

const path = require('path');

module.exports = {
    // ── Input ────────────────────────────────────────────────────────────────
    // Root directory that UTAM will scan for .utam.json files.
    pageObjectsRootDir: path.resolve(__dirname, 'pageObjects'),

    // Glob patterns (relative to pageObjectsRootDir) to include.
    pageObjectsFileMask: ['**/*.utam.json'],

    // ── Output ───────────────────────────────────────────────────────────────
    // Where to write the generated JavaScript page objects.
    outputDir: path.resolve(__dirname, '__utam__'),

    // Target module system.
    module: 'commonjs',

    // ── Namespace ────────────────────────────────────────────────────────────
    // Maps the package/namespace prefix used inside page objects to their
    // compiled output location.  "lgb" mirrors the LWC namespace.
    namespaceMapping: [
        {
            typePrefix: 'utam-lgb',
            typeDir:    path.resolve(__dirname, '__utam__'),
        },
    ],
};

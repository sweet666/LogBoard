/**
 * Custom Jest resolver that makes @salesforce/sfdx-lwc-jest@0.7.x work with Jest 27+.
 *
 * Jest 27 changed custom resolvers: the default resolver is now passed as
 * `options.defaultResolver` instead of being importable from a private path.
 * The old @lwc/jest-resolver still tries to `require('jest-resolve/build/defaultResolver')`
 * which no longer exists.  This shim bypasses it entirely.
 */

'use strict';

const fs   = require('fs');
const path = require('path');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const LIGHTNING_STUBS_DIR = path.join(
    PROJECT_ROOT,
    'node_modules/@salesforce/sfdx-lwc-jest/src/lightning-stubs'
);

const EMPTY_CSS  = path.join(PROJECT_ROOT, 'node_modules/@lwc/jest-resolver/resources/emptyStyleMock.js');
const EMPTY_HTML = path.join(PROJECT_ROOT, 'node_modules/@lwc/jest-resolver/resources/emptyHtmlMock.js');

const LWC_ENGINE   = path.join(PROJECT_ROOT, 'node_modules/@lwc/engine/dist/engine.cjs.js');
// Fallback if the above doesn't exist
const LWC_ENGINE_FALLBACK = require.resolve('@lwc/engine');

const WHITELISTED = {
    lwc: LWC_ENGINE_FALLBACK,
};

/**
 * Converts a camelCase stub folder name to a kebab-case module id and vice-versa.
 * e.g. "buttonIcon" → finds the stub at lightning-stubs/buttonIcon/buttonIcon.js
 */
function getLightningStub(name) {
    const stubPath = path.join(LIGHTNING_STUBS_DIR, name, name + '.js');
    if (fs.existsSync(stubPath)) return stubPath;
    return null;
}

/**
 * Turn a kebab-case module name into camelCase for looking up the stub folder.
 * e.g. "button-icon" → "buttonIcon", "formattedRichText" stays as-is
 */
function toCamelCase(str) {
    return str.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
}

function getLwcComponentPath(name) {
    // Looks for c/<name> component in force-app
    const modulesDir = path.join(PROJECT_ROOT, 'force-app/main/default/lwc');
    const compPath   = path.join(modulesDir, name, name + '.js');
    if (fs.existsSync(compPath)) return compPath;
    return null;
}

module.exports = function resolver(request, options) {
    const defaultResolver = options.defaultResolver;

    // 1. lwc → @lwc/engine
    if (WHITELISTED[request]) return WHITELISTED[request];

    // 2. CSS imports → empty mock
    if (path.extname(request) === '.css') return EMPTY_CSS;

    // 3. lightning/* → stubs
    if (request.startsWith('lightning/')) {
        const name     = request.slice('lightning/'.length);
        const camel    = toCamelCase(name);
        const stub     = getLightningStub(camel) || getLightningStub(name);
        if (stub) return stub;
    }

    // 4. c/* → local LWC components
    if (request.startsWith('c/')) {
        const name  = request.slice('c/'.length);
        const camel = toCamelCase(name);
        const comp  = getLwcComponentPath(camel) || getLwcComponentPath(name);
        if (comp) return comp;
    }

    // 5. @salesforce/apex/* → resolved by moduleNameMapper (jest.config.js)
    //    Fall through to the default resolver — if the moduleNameMapper fires
    //    first this branch won't even be reached.

    // 6. Default
    return defaultResolver(request, options);
};

'use strict';

const path = require('path');

// Project root is one level above this config folder
const PROJECT_ROOT = path.resolve(__dirname, '..');

module.exports = {
    rootDir: PROJECT_ROOT,
    moduleFileExtensions: ['js', 'html'],
    // jest-environment-jsdom-fifteen ships jsdom v15 which includes native
    // Shadow DOM support that @lwc/engine requires (attachShadow, ShadowRoot…).
    // It lives inside @lwc/jest-preset's own node_modules because it is the
    // exact version the LWC jest preset was designed to run against.
    testEnvironment: path.join(
        PROJECT_ROOT,
        'node_modules/@lwc/jest-preset/node_modules/jest-environment-jsdom-fifteen'
    ),

    // Use the LWC transformer for .js, .html, and .css files
    transform: {
        '^.+\\.(js|html|css)$': path.resolve(
            PROJECT_ROOT,
            'node_modules/@lwc/jest-transformer/src/index.js'
        ),
    },

    // Let the transformer handle LWC files inside node_modules
    transformIgnorePatterns: [
        '/node_modules/(?!(@salesforce/sfdx-lwc-jest/src/lightning-stubs|@lwc)/)',
    ],

    // Custom resolver — bridges Jest 30's resolver API with the old LWC stubs
    resolver: path.resolve(__dirname, 'jest.resolver.js'),

    // Map @salesforce/* virtual modules to inline mocks.
    //
    // NOTE: @salesforce/apex/* is intentionally NOT in this mapper.
    //
    // The @lwc/jest-transformer compiles Apex default imports into a try/catch:
    //   try { fn = require('@salesforce/apex/Cls.method').default; }
    //   catch (e) { fn = global.__lwcJestMock_fn || function(){ return Promise.resolve(); }; }
    //
    // If we map Apex paths here they ALL resolve to the same jest.apexMock.js
    // (module.exports = jest.fn()), so `.default` is always undefined and every
    // Apex method in the component silently becomes undefined — breaking the
    // independent jest.mock() virtual mocks tests set up per method.
    //
    // Without this mapping the require() throws (no real @salesforce/apex package),
    // the catch block fires, and the global fallback or the virtual mock takes over
    // correctly — giving each Apex method its own independently-configurable jest.fn().
    moduleNameMapper: {
        // Other @salesforce/* scoped modules (labels, schema, etc.)
        //
        // The negative lookahead (?!apex/) ensures that @salesforce/apex/* paths
        // are NOT caught here. Without the exclusion, ALL apex imports resolve to
        // jest.salesforceMock.js (which exports {}), making .default undefined and
        // breaking every Apex method in the component under test.
        //
        // @salesforce/apex/* paths are handled by the @lwc/jest-transformer:
        //   try { fn = require('@salesforce/apex/Cls.method').default; }
        //   catch (e) { fn = global.__lwcJestMock_fn || function(){ return Promise.resolve(); }; }
        // The require() throws (no real module), the catch fires, and each test's
        // jest.mock('@salesforce/apex/...', factory, { virtual: true }) provides
        // the correctly-typed mock via the global.__lwcJestMock_fn mechanism.
        '^@salesforce/(?!apex/)(.+)$': path.resolve(__dirname, 'jest.salesforceMock.js'),
    },

    testPathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/e2e-tests/'],

    collectCoverageFrom: ['force-app/main/default/lwc/**/*.js'],

    snapshotSerializers: [
        path.resolve(PROJECT_ROOT, 'node_modules/@lwc/jest-serializer/src/index.js'),
    ],
};

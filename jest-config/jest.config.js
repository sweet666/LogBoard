'use strict';

const path = require('path');

// Project root is one level above this config folder
const PROJECT_ROOT = path.resolve(__dirname, '..');

module.exports = {
    rootDir: PROJECT_ROOT,
    moduleFileExtensions: ['js', 'html'],
    testEnvironment: path.join(PROJECT_ROOT, 'node_modules/jest-runner/node_modules/jest-environment-jsdom'),

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

    // Map @salesforce/* virtual modules to inline mocks
    moduleNameMapper: {
        // Each Apex method import gets its own auto-mock
        '^@salesforce/apex/(.+)$': path.resolve(__dirname, 'jest.apexMock.js'),
        // Other @salesforce/* scoped modules (labels, schema, etc.)
        '^@salesforce/(.+)$': path.resolve(__dirname, 'jest.salesforceMock.js'),
    },

    testPathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/e2e-tests/'],

    collectCoverageFrom: ['force-app/main/default/lwc/**/*.js'],

    snapshotSerializers: [
        path.resolve(PROJECT_ROOT, 'node_modules/@lwc/jest-serializer/src/index.js'),
    ],
};

'use strict';

/**
 * Detects the installed Chrome major version and installs the exactly matching
 * chromedriver npm package.  Runs automatically as an npm postinstall script.
 *
 * Why: `chromedriver@latest` is always built for the newest Chrome release.
 * When your local Chrome is on a different major version the WebDriver session
 * handshake fails with "This version of ChromeDriver only supports Chrome vN".
 * Installing the version-matched package avoids that entirely.
 */

const { execSync, spawnSync } = require('child_process');

const CHROME_PATHS = [
    // macOS
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary',
    // Linux
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/chromium-browser',
    '/usr/bin/chromium',
    // Windows (run under Git Bash / WSL)
    '/c/Program Files/Google/Chrome/Application/chrome.exe',
    '/c/Program Files (x86)/Google/Chrome/Application/chrome.exe',
];

function detectChromeVersion() {
    for (const p of CHROME_PATHS) {
        try {
            const out = execSync(`"${p}" --version 2>/dev/null`, { timeout: 5000 }).toString();
            const match = out.match(/(\d+)\./);
            if (match) return match[1];
        } catch {
            // path doesn't exist or failed — try next
        }
    }

    // Last-ditch: try `google-chrome` and `chromium` from PATH
    for (const cmd of ['google-chrome', 'chromium', 'chromium-browser']) {
        try {
            const out = execSync(`${cmd} --version 2>/dev/null`, { timeout: 5000 }).toString();
            const match = out.match(/(\d+)\./);
            if (match) return match[1];
        } catch {
            // not on PATH
        }
    }

    return null;
}

const version = detectChromeVersion();

if (!version) {
    console.warn(
        '\n[install-chromedriver] Could not detect Chrome version.\n' +
        'chromedriver@latest was installed; if tests fail with a version mismatch run:\n' +
        '  npm install --no-save chromedriver@<your-chrome-major-version>\n'
    );
    process.exit(0);
}

console.log(`[install-chromedriver] Detected Chrome ${version} — installing chromedriver@${version}…`);

const result = spawnSync(
    'npm',
    ['install', '--no-save', '--prefer-online', `chromedriver@${version}`],
    { stdio: 'inherit', shell: true }
);

if (result.status !== 0) {
    console.error(
        `[install-chromedriver] Failed to install chromedriver@${version}.\n` +
        'Try manually: npm install --no-save chromedriver@' + version
    );
    process.exit(0); // non-fatal — don't break the overall install
}

console.log(`[install-chromedriver] chromedriver@${version} ready.`);

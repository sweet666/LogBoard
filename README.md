# LogBoard

A Salesforce Lightning Web Component tool for managing debug trace flags and viewing Apex debug logs directly from any Lightning tab — without leaving the org.

---

## 1. How to Install

Install the managed package into your Salesforce org using the link below. Open it in a browser while logged in to the target org and follow the standard installation wizard.

```
/packaging/installPackage.apexp?p0=04tKY000000Z1bV
```

**Required post-install step — Deploy RSS and TSS**

<img width="352" height="196" alt="Screenshot 2026-04-27 at 13 58 12" src="https://github.com/user-attachments/assets/68f7524a-3993-4f3c-9e2e-3ceb271e37e0" />

Before using LogBoard for the first time, you must deploy the Remote Site Setting and the Trusted Site Setting that allow the component to make authenticated callouts back to the org's own domain.

1. Open the LogBoard tab after installation.
2. Click the **⚙ settings** icon in the top-right corner of the component.
3. Select **Deploy RSS and TSS** from the menu.
4. Wait for the success toast notifications confirming both settings were created or already existed.

> **Note:** After clicking "Deploy RSS and TSS", the Remote Site and Trusted Site settings may take some time to become active in Salesforce. If log bodies fail to load immediately after deploying, wait a minute and try again before investigating further.

---

## 2. How to Use

LogBoard is exposed as a Lightning tab (`Log Board` tab) and can be added to any Lightning app through the App Builder.

<img width="1486" height="392" alt="Screenshot 2026-04-27 at 13 59 22" src="https://github.com/user-attachments/assets/050e0007-e046-4daa-8c18-01f59c44ecec" />


### Enabling and stopping debug logging

The header bar shows the current debug status. When no trace flag is active, it displays **"Debug disabled"**.

- Click **Enable** to activate a `USER_DEBUG` trace flag for the selected user. The countdown timer starts immediately, showing the remaining time in `mm:ss` format.
- Click **Stop** to immediately expire the active trace flag.

While a trace flag is active, the duration buttons are disabled to prevent accidental changes mid-session.

### Selecting debug duration

Five duration buttons (1 / 2 / 3 / 5 / 10 minutes) let you choose how long the trace flag will be active before clicking **Enable**. The currently selected duration is highlighted. The default is **1 minute**.

### Choosing the traced user

The **User** combobox in the top-right of the header lets you switch between two targets:

- **Current User** — traces the user currently logged in (default).
- **Automated Process** — traces the `autoproc` system user, useful for debugging scheduled jobs, flows, and process builder automation.

Switching the user immediately re-initialises the trace flag check for the selected user.

### Log table

The log table lists the most recent 100 `ApexLog` records, ordered by start time (newest first). Each row shows:

- **Start Time** — formatted as `HH:mm:ss, dd MMM`
- **Operation** — the entry point that generated the log
- **Status** — execution status (e.g. `Success`)
- **User** — the user whose code produced the log
- **Size** — log size in MB (displayed as `0.01` for very small logs)

Each row has two action buttons: **View** (opens the log inline) and **Download** (opens the raw log file in a new browser tab via `/servlet/servlet.FileDownload`).

### Viewing a log

Clicking **View** on any row opens the **Log View** panel. Log lines are colour-coded for fast scanning:

| Colour | Log event types |
|--------|----------------|
| 🟡 Yellow | `CODE_UNIT_*`, `METHOD_*` |
| 🟣 Purple | `CALLOUT_*` |
| 🩵 Cyan | `SOQL_EXECUTE_*` |
| 🟢 Green | `USER_DEBUG` |
| 🔴 Red | `EXCEPTION_THROWN`, `FATAL_ERROR` |

<img width="1512" height="606" alt="Screenshot 2026-04-27 at 14 00 31" src="https://github.com/user-attachments/assets/35ca2892-da91-470b-8b71-557ddbcef23d" />

The **Debug only** toggle filters the view to show only `USER_DEBUG` lines. If no debug lines exist, the panel shows "Nothing to show".

The **Download** button inside the viewer opens the raw log file in a new tab. Close the viewer with the **Close** button or by pressing **Escape**.

### Searching across logs

<img width="1488" height="400" alt="Screenshot 2026-04-27 at 14 01 26" src="https://github.com/user-attachments/assets/9d16f2b9-e4cc-4fcf-a282-2a0080440aa6" />


The search input in the header searches the body of every log currently in the table simultaneously.

1. Type a search term into the **search in logs** field.
2. Press **Enter** or click the search (🔍) icon button.
3. The **Search Results** panel opens, showing each matching line with one line of context above and below it, colour-coded using the same scheme as the log viewer.
4. Use the **Previous** / **Next** buttons to navigate between results.
5. Click **Open Full Log** to jump directly to the full log view for the result currently in focus.
6. Close search results with the **✕** button or by pressing **Escape**.

### Refreshing the log table

- Click the **Refresh** (↺) icon button to manually reload the log list.
- Enable the **Auto refresh** toggle to poll for new logs automatically every **3 seconds**. While auto-refresh is on, the manual refresh button is disabled. The auto-refresh preference is persisted per user via the `Log_Board_Settings__c` custom setting and restored on the next page load.

### Deleting logs

Click the **Delete** (🗑) icon button to delete all visible `ApexLog` records. The button is disabled when the table is empty. After deletion, the table is automatically refreshed.

### Settings menu (⚙)

The gear menu in the top-right corner provides three options:

- **Deploy RSS and TSS** — creates or updates the Remote Site Setting and Trusted Site Setting required for log body callouts. Run this after installation or if log bodies stop loading.
- **Edit Debug Level** — opens the standard Salesforce Debug Level editor in a new tab, pre-filtered to the current trace flag. Use this to change the verbosity of individual log categories (Apex, Workflow, Callout, etc.).
- **Edit Log Filter** — opens an inline modal where you can set a custom SOQL `WHERE` clause that is appended to the `ApexLog` query. Only logs matching the filter are shown in the table.

### Log filter

<img width="1488" height="400" alt="Screenshot 2026-04-27 at 14 01 26" src="https://github.com/user-attachments/assets/d2e8c908-a573-4dcc-b89e-a537c35e7eca" />


The filter is the `WHERE` clause of the SOQL query that fetches logs. The default filter installed by the post-install script is:

```
Operation != '/apex/lgb__sessionidpage' AND LogLength > 1800
```

This excludes the internal Visualforce page used for session ID retrieval and hides very small (likely empty) logs. You can replace it with any valid `ApexLog` SOQL predicate, for example:

```
Status = 'Success' AND LogLength > 50000
```

Leaving the filter empty returns all logs (up to the 100-record limit). The filter is validated by running a test query before saving; an error toast is shown if the syntax is invalid.

### Keyboard shortcuts

| Key | Action |
|-----|--------|
| `Escape` | Closes the Log View, Search Results, or Edit Filter modal (whichever is open) |

---

## 3. Architecture

### Project structure

`logBoard` owns all shared state (trace flag, logs list, search results, settings) and passes data down via `@api` properties. Child components communicate upward exclusively through custom events (`viewlog`, `close`, `save`, `fulllog`).

### Authentication and callouts

Salesforce LWC components cannot directly call the Tooling API or the log body endpoint because they run in the browser and do not have access to a server-side session token. LogBoard works around this in two ways:

1. **Tooling API calls (trace flag management)** — executed server-side via `LogBoardController` Apex methods using the implicit OAuth session (`HttpHelper` sets `Authorization: OAuth {session ID}`).

2. **Log body retrieval** — the log body endpoint returns the raw text of a log file and must be called from the browser (to avoid Apex governor limits on response sizes). `getLogBodyCalloutParams()` constructs the callout URL and extracts the real session ID from `SessionIdPage.page` (a Visualforce page that echoes `{!$Api.Session_ID}` between known markers). The LWC then calls the browser `fetch()` API directly with that token. The Remote Site Setting and Trusted Site Setting created by "Deploy RSS and TSS" are required for this browser-side fetch to succeed.

### Trace flag lifecycle

On component load, `LogBoardController.getActiveTraceFlag` queries the Tooling API for an existing `USER_DEBUG` `TraceFlag` for the selected user. If no record exists, it creates one (with a 4-second expiry so it is immediately dormant). If a valid (non-expired) flag is found, the countdown timer starts from the remaining expiry time; otherwise the component shows "Debug disabled".

Clicking **Enable** calls `updateTraceFlag`, which PATCHes the `ExpirationDate` of the existing flag to `now + duration minutes`. Clicking **Stop** PATCHes the expiry to `now + 2 seconds`, causing the flag to expire almost immediately.

The countdown timer uses `Date.now()` subtraction on each tick against the stored target timestamp, so it stays accurate even when the browser tab is inactive or throttled.

### Custom setting — `Log_Board_Settings__c`

A Hierarchy custom setting (org-level defaults) with two fields:

| Field | Type | Purpose |
|-------|------|---------|
| `LGB__Log_Filter__c` | Text | SOQL `WHERE` clause appended to the ApexLog query |
| `LGB__Is_Autorefresh__c` | Checkbox | Persists the auto-refresh toggle state across sessions |

Settings are read on component load via `getSettings()` and written back immediately when the user changes the filter or toggles auto-refresh.

### Remote Site and Trusted Site settings (RSS / TSS)

LogBoard needs to call back to the org's own domain from the browser. Two metadata records are deployed by the "Deploy RSS and TSS" action:

- **Remote Site Setting (`selfRSS`)** — permits server-side Apex callouts to the org URL.
- **CSP Trusted Site (`selfTSS`)** — adds the org URL to the Lightning Content Security Policy allowlist, enabling the browser `fetch()` calls for log bodies.

Both are created by `MetadataUtility` using the SOAP Metadata API via `MetadataHelper`, authenticated with the session ID obtained from `SessionIdPage`.

### Post-install script

`PostInstall.cls` implements `InstallHandler` and runs automatically after package installation. It calls `Utility.createLogBoardSettings()`, which inserts an org-default `Log_Board_Settings__c` record pre-populated with the default log filter (`Operation != '/apex/lgb__sessionidpage' AND LogLength > 1800`).

### Testing

**Apex tests** live alongside each class (`*Test.cls`). HTTP callouts are stubbed with `LogBoardAPIMocks.cls` and `MetadataHelperMock.cls` using the `HttpCalloutMock` interface.

**LWC unit tests** use `@salesforce/sfdx-lwc-jest` with Jest. All five components have a `__tests__` folder. The test runner is isolated in `lwc-jest-runner/` to manage Node/Jest version compatibility. Jest configuration files are kept in `jest-config/` at the project root.

Run LWC tests with:

```bash
npm run test:unit
```

**E2E tests** use [WebDriverIO](https://webdriver.io/) with the [UTAM](https://utam.dev/) page object framework. They run against a real Salesforce org through Chrome and cover the full user-facing workflow: debug flag lifecycle, log table interactions, log viewer, search, and the log filter editor. Tests live in `e2e-tests/`.

---

## 4. Running E2E Tests

### Prerequisites

- **Node.js 18+** and **npm 9+**
- **Google Chrome** installed on the machine running the tests
- The LogBoard component deployed to a Salesforce org (see section 1)
- The RSS and TSS settings deployed in that org (see section 1)
- A dedicated test user with the `System Administrator` profile (or at minimum: `Modify All Data`, `Author Apex`, `Manage Users` permissions)

> **Tip:** Use a scratch org or a developer sandbox so test runs don't pollute production logs.

### 1. Install dependencies

```bash
cd e2e-tests
npm install
```

### 2. Set environment variables

The test suite reads credentials from environment variables — never hard-code them in source files.

| Variable | Required | Description |
|----------|----------|-------------|
| `SF_ORG_URL` | ✅ | Login URL of the org, e.g. `https://login.salesforce.com` or `https://myorg.my.salesforce.com` |
| `SF_USERNAME` | ✅ | Username of the test user |
| `SF_PASSWORD` | ✅ | Password of the test user |
| `SF_APP_URL` | optional | Full Lightning URL to the LogBoard tab. Auto-built from `SF_ORG_URL` if omitted (`/lightning/n/lgb__Log_Board`) |
| `HEADLESS` | optional | Set to `true` to run Chrome in headless mode (useful in CI) |

Export them in your shell session:

```bash
export SF_ORG_URL="https://your-org.my.salesforce.com"
export SF_USERNAME="testuser@your-org.com"
export SF_PASSWORD="yourPassword"
```

Or pass them inline:

```bash
SF_ORG_URL=https://your-org.my.salesforce.com \
SF_USERNAME=testuser@your-org.com \
SF_PASSWORD=yourPassword \
npm run test:e2e
```

### 3. Build page objects and run tests

```bash
# Headed Chrome (default)
npm run test:e2e

# Headless Chrome (for CI / no display)
npm run test:e2e:headless

# Verbose output for debugging
npm run test:e2e:debug
```

You can also run these from the project root:

```bash
npm run test:e2e
npm run test:e2e:headless
```

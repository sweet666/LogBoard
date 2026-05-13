'use strict';

/**
 * Jest setup file — runs in the jsdom environment before any test module is loaded.
 *
 * jsdom v14 (shipped with jest-environment-jsdom@24) does not implement the
 * Shadow DOM API, so @lwc/engine crashes on import with "ShadowRoot is not defined".
 *
 * This polyfill provides the minimal ShadowRoot global that @lwc/engine needs:
 *   - ShadowRoot.prototype.host   (getter)
 *   - ShadowRoot.prototype.innerHTML  (getter + setter)
 */

if (typeof ShadowRoot === 'undefined') {
    class ShadowRoot {
        constructor() {
            this._host     = null;
            this._innerHTML = '';
        }

        get host()        { return this._host; }
        get innerHTML()   { return this._innerHTML; }
        set innerHTML(v)  { this._innerHTML = v; }
        get textContent() { return this._innerHTML; }
        set textContent(v){ this._innerHTML = v; }
        get mode()        { return 'open'; }
    }

    global.ShadowRoot = ShadowRoot;
}

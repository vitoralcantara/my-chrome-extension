# Copilot / AI Agent Instructions for this repository

Purpose: quick orientation and actionable conventions to help an AI coding agent be productive in this TypeScript Chrome extension.

- **Architecture (big picture):** Chrome Extension (Manifest V3) written in TypeScript. Entry points:
  - Background service worker: `src/background.ts`
  - Content script: `src/contentScript.ts`
  - Popup UI: `src/popup/popup.ts` with `src/popup/popup.html`
  - Options UI: `src/options/options.ts` with `src/options/options.html`

- **Build & dev workflow:**
  - Install deps: `npm install`
  - Build: `npm run build` (runs `tsc` — outputs to `./dist` per `tsconfig.json`)
  - Watch: `npm run watch`
  - Start: `npm run start` runs `npm run build && chrome-extension-cli serve` (project uses `chrome-extension-cli` for serving; verify how it maps `src` → served files)
  - Chrome load: typically build and `Load unpacked` in `chrome://extensions/` pointing to the built output. Note: `manifest.json` currently references `src/*.ts` which is unusual — do not change `manifest.json` without confirming the dev server behavior.

- **Project-specific conventions and patterns:**
  - Source lives under `src/`; `tsconfig.json` has `rootDir: ./src` and `outDir: ./dist` and `strict: true`.
  - The code expects helper modules that may not yet exist (e.g., `src/options/options.ts` imports './storage' and `popup.ts` imports `../options/options`). When adding or refactoring, keep these module boundaries and exported function names stable: `getOptions`, `saveOptions`, `getUserSettings`, `saveUserSettings`.
  - Background uses a polyfill-style import: `import { Runtime } from 'webextension-polyfill-ts'` — prefer using the polyfill consistent with other modules.
  - UI components are simple DOM-manipulation scripts (no framework). Edit HTML in `src/popup` and `src/options` and match IDs used by the TypeScript files (e.g., `popup-form`, `settings-input`, `options-form`, `input-field`).

- **Integration points & external deps:**
  - `manifest.json` permissions: `storage`, `activeTab`. Changes to permissions must be reflected in `manifest.json` and validated in Chrome.
  - `package.json` dev tools include `typescript` and `chrome-extension-cli`. Confirm `chrome-extension-cli` usage if you modify dev/start scripts.

- **Cross-component communication:**
  - Popup and Options modules call shared functions in `src/options` (so treat that file as a small API surface).
  - Content script injects UI into pages by directly manipulating `document.body` — be defensive when changing selectors or styles to avoid breaking pages.

- **Search tips & concrete examples:**
  - To find background logic: open `src/background.ts` and search for `Runtime.onInstalled` or `onStartup`.
  - To find storage helpers: search for `getOptions`, `saveOptions`, `getUserSettings`, `saveUserSettings`.
  - UI files: `src/popup/popup.html`, `src/options/options.html` — match element IDs to TS code.

- **When editing code:**
  - Run `npm run build` and load the extension to verify behavior in Chrome.
  - Respect TypeScript compiler options in `tsconfig.json` (strict mode). Keep source under `src/`.
  - Do not assume background/service worker path mapping — verify whether `chrome-extension-cli` rewrites `manifest.json` references or whether builds copy/emit files to expected paths.

If any of these notes are unclear or you want additional examples (e.g., common refactors, tests, or adding a new permission), tell me which section to expand.

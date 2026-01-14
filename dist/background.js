"use strict";
// `chrome` is declared globally in `src/types/chrome.d.ts`
var _a, _b, _c, _d;
(_b = (_a = chrome.runtime) === null || _a === void 0 ? void 0 : _a.onInstalled) === null || _b === void 0 ? void 0 : _b.addListener(() => {
    console.log('Extension installed');
});
(_d = (_c = chrome.runtime) === null || _c === void 0 ? void 0 : _c.onStartup) === null || _d === void 0 ? void 0 : _d.addListener(() => {
    console.log('Extension started');
});
// Add any additional background event listeners or logic here

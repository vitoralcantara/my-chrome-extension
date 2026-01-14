"use strict";
// `chrome` is declared globally in `src/types/chrome.d.ts`
var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
(_b = (_a = chrome.runtime) === null || _a === void 0 ? void 0 : _a.onInstalled) === null || _b === void 0 ? void 0 : _b.addListener(() => {
    console.log('Extension installed');
});
(_d = (_c = chrome.runtime) === null || _c === void 0 ? void 0 : _c.onStartup) === null || _d === void 0 ? void 0 : _d.addListener(() => {
    console.log('Extension started');
});
// Add any additional background event listeners or logic here
// Create a context menu item to open PDFs with the extension viewer
(_f = (_e = chrome.runtime) === null || _e === void 0 ? void 0 : _e.onInstalled) === null || _f === void 0 ? void 0 : _f.addListener(() => {
    try {
        chrome.contextMenus.create({
            id: 'open-with-extension',
            title: 'Abrir com a extensão (viewer)',
            contexts: ['page', 'link']
        });
    }
    catch (e) {
        console.warn('Could not create context menu', e);
    }
});
(_h = (_g = chrome.contextMenus) === null || _g === void 0 ? void 0 : _g.onClicked) === null || _h === void 0 ? void 0 : _h.addListener((info, tab) => {
    const url = info.linkUrl || info.pageUrl || info.srcUrl;
    if (!url)
        return;
    const viewerUrl = chrome.runtime.getURL('src/viewer/viewer.html') + '?src=' + encodeURIComponent(url);
    chrome.tabs.create({ url: viewerUrl });
});
// Auto-redirect tabs that load PDFs to the extension viewer
(_k = (_j = chrome.tabs) === null || _j === void 0 ? void 0 : _j.onUpdated) === null || _k === void 0 ? void 0 : _k.addListener((tabId, changeInfo, tab) => {
    try {
        if (changeInfo.status !== 'complete' || !(tab === null || tab === void 0 ? void 0 : tab.url))
            return;
        const url = tab.url;
        // simple check for .pdf in path/query/hash
        if (/\.pdf(\?|#|$)/i.test(url)) {
            // avoid redirecting the viewer itself (either path variant)
            if (url.includes('/viewer/viewer.html') || url.includes('/src/viewer/viewer.html'))
                return;
            // For local file:// URLs, redirect only if the user granted file URL access to the extension
            if (url.startsWith('file://')) {
                try {
                    if (chrome.extension && typeof chrome.extension.isAllowedFileSchemeAccess === 'function') {
                        chrome.extension.isAllowedFileSchemeAccess((isAllowed) => {
                            if (!isAllowed)
                                return;
                            const viewerUrl = chrome.runtime.getURL('src/viewer/viewer.html') + '?src=' + encodeURIComponent(url);
                            chrome.tabs.update(tabId, { url: viewerUrl });
                        });
                    }
                }
                catch (e) {
                    console.warn('Error checking file-scheme access', e);
                }
                return;
            }
            const viewerUrl = chrome.runtime.getURL('src/viewer/viewer.html') + '?src=' + encodeURIComponent(url);
            // replace the tab URL with our viewer
            chrome.tabs.update(tabId, { url: viewerUrl });
        }
    }
    catch (e) {
        console.warn('Error in tabs.onUpdated redirect check', e);
    }
});

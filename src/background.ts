// `chrome` is declared globally in `src/types/chrome.d.ts`

chrome.runtime?.onInstalled?.addListener(() => {
    console.log('Extension installed');
});

chrome.runtime?.onStartup?.addListener(() => {
    console.log('Extension started');
});

// Add any additional background event listeners or logic here
// Create a context menu item to open PDFs with the extension viewer
chrome.runtime?.onInstalled?.addListener(() => {
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

chrome.contextMenus?.onClicked?.addListener((info: any, tab: any) => {
    const url = info.linkUrl || info.pageUrl || info.srcUrl;
    if (!url) return;
    const viewerUrl = chrome.runtime.getURL('src/viewer/viewer.html') + '?src=' + encodeURIComponent(url);
    chrome.tabs.create({ url: viewerUrl });
});

// Auto-redirect tabs that load PDFs to the extension viewer
chrome.tabs?.onUpdated?.addListener((tabId: number, changeInfo: any, tab: any) => {
    try {
        if (changeInfo.status !== 'complete' || !tab?.url)
            return;
        const url: string = tab.url;
        // simple check for .pdf in path/query/hash
        if (/\.pdf(\?|#|$)/i.test(url)) {
            // avoid redirecting the viewer itself (either path variant)
            if (url.includes('/viewer/viewer.html') || url.includes('/src/viewer/viewer.html')) return;
            // For local file:// URLs, redirect only if the user granted file URL access to the extension
            if (url.startsWith('file://')) {
                try {
                    if (chrome.extension && typeof chrome.extension.isAllowedFileSchemeAccess === 'function') {
                        chrome.extension.isAllowedFileSchemeAccess((isAllowed: boolean) => {
                            if (!isAllowed) return;
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

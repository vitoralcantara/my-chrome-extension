// `chrome` is declared globally in `src/types/chrome.d.ts`

chrome.runtime?.onInstalled?.addListener(() => {
    console.log('Extension installed');
});

chrome.runtime?.onStartup?.addListener(() => {
    console.log('Extension started');
});

// Add any additional background event listeners or logic here

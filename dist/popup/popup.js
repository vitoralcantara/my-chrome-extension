"use strict";
// `chrome` is declared globally in `src/types/chrome.d.ts`
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
// Use chrome.storage directly instead of importing options helpers to keep popup script self-contained
const getUserSettings = () => __awaiter(void 0, void 0, void 0, function* () {
    return new Promise((resolve) => {
        chrome.storage.local.get(['someSetting'], (result) => {
            var _a;
            resolve((_a = result === null || result === void 0 ? void 0 : result.someSetting) !== null && _a !== void 0 ? _a : null);
        });
    });
});
const saveUserSettings = (value) => __awaiter(void 0, void 0, void 0, function* () {
    return new Promise((resolve) => {
        chrome.storage.local.set({ someSetting: value }, () => resolve());
    });
});
const popupForm = document.getElementById('popup-form');
const settingsInput = document.getElementById('settings-input');
const pdfInput = document.getElementById('pdf-input');
const openPdfButton = document.getElementById('open-pdf-button');
document.addEventListener('DOMContentLoaded', () => __awaiter(void 0, void 0, void 0, function* () {
    if (settingsInput) {
        try {
            const userSettings = yield getUserSettings();
            settingsInput.value = userSettings || '';
        }
        catch (e) {
            console.warn('Could not load user settings', e);
        }
    }
}));
if (popupForm && settingsInput) {
    popupForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const newSettings = settingsInput.value;
        saveUserSettings(newSettings);
        alert('Settings saved!');
    });
}
if (openPdfButton && pdfInput) {
    openPdfButton.addEventListener('click', () => {
        const files = pdfInput.files;
        if (!files || files.length === 0) {
            alert('Selecione um arquivo PDF.');
            return;
        }
        const file = files[0];
        if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
            alert('Por favor selecione um arquivo PDF.');
            return;
        }
        const blobUrl = URL.createObjectURL(file);
        try {
            chrome.tabs.create({ url: blobUrl }, () => {
                // Close popup after opening
                window.close();
            });
        }
        catch (e) {
            // Fallback: open in same window
            window.open(blobUrl, '_blank');
            window.close();
        }
    });
}

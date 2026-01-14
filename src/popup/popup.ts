// `chrome` is declared globally in `src/types/chrome.d.ts`

// Use chrome.storage directly instead of importing options helpers to keep popup script self-contained
const getUserSettings = async (): Promise<string | null> => {
    return new Promise((resolve) => {
        chrome.storage.local.get(['someSetting'], (result: any) => {
            resolve(result?.someSetting ?? null);
        });
    });
};

const saveUserSettings = async (value: string): Promise<void> => {
    return new Promise((resolve) => {
        chrome.storage.local.set({ someSetting: value }, () => resolve());
    });
};

const popupForm = document.getElementById('popup-form') as HTMLFormElement | null;
const settingsInput = document.getElementById('settings-input') as HTMLInputElement | null;
const pdfInput = document.getElementById('pdf-input') as HTMLInputElement | null;
const openPdfButton = document.getElementById('open-pdf-button') as HTMLButtonElement | null;

document.addEventListener('DOMContentLoaded', async () => {
    if (settingsInput) {
        try {
            const userSettings = await getUserSettings();
            settingsInput.value = userSettings || '';
        } catch (e) {
            console.warn('Could not load user settings', e);
        }
    }
});

if (popupForm && settingsInput) {
    popupForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const newSettings = settingsInput.value;
        saveUserSettings(newSettings);
        alert('Settings saved!');
    });
}

if (openPdfButton && pdfInput) {
    const openSelectedPdf = () => {
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
            (chrome.tabs as any).create({ url: blobUrl }, () => {
                window.close();
            });
        }
        catch (e) {
            window.open(blobUrl, '_blank');
            window.close();
        }
    };

    openPdfButton.addEventListener('click', openSelectedPdf);
    pdfInput.addEventListener('change', openSelectedPdf);
}
import { saveOptions, getOptions, Options } from './storage';

export async function getUserSettings(): Promise<string | null> {
    const opts = await getOptions();
    return opts.someSetting ?? null;
}

export async function saveUserSettings(value: string): Promise<void> {
    const opts: Options = { someSetting: value };
    await saveOptions(opts);
}

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('options-form') as HTMLFormElement;
    const inputField = document.getElementById('input-field') as HTMLInputElement;

    // Load saved options
    getOptions().then((options: Options) => {
        inputField.value = options.someSetting || '';
    });

    form.addEventListener('submit', (event) => {
        event.preventDefault();
        const newOptions: Options = {
            someSetting: inputField.value,
        };
        saveOptions(newOptions);
    });
});
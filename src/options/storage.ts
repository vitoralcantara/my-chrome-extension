export type Options = {
    someSetting?: string;
};

export function getOptions(): Promise<Options> {
    return new Promise((resolve) => {
        try {
            const raw = localStorage.getItem('extension_options');
            if (!raw) return resolve({});
            const parsed = JSON.parse(raw) as Options;
            resolve(parsed);
        } catch (e) {
            resolve({});
        }
    });
}

export function saveOptions(options: Options): Promise<void> {
    return new Promise((resolve) => {
        try {
            localStorage.setItem('extension_options', JSON.stringify(options));
        } catch (e) {
            // ignore
        }
        resolve();
    });
}

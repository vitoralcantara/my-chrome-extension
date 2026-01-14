export function getOptions() {
    return new Promise((resolve) => {
        try {
            const raw = localStorage.getItem('extension_options');
            if (!raw)
                return resolve({});
            const parsed = JSON.parse(raw);
            resolve(parsed);
        }
        catch (e) {
            resolve({});
        }
    });
}
export function saveOptions(options) {
    return new Promise((resolve) => {
        try {
            localStorage.setItem('extension_options', JSON.stringify(options));
        }
        catch (e) {
            // ignore
        }
        resolve();
    });
}

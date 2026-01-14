function getQueryParam(name: string): string | null {
    const params = new URLSearchParams(location.search);
    return params.get(name);
}

document.addEventListener('DOMContentLoaded', () => {
    const src = getQueryParam('src');
    const frame = document.getElementById('pdf-frame') as HTMLIFrameElement | null;
    if (!frame) return;
    if (!src) {
        frame.srcdoc = '<p>No PDF specified.</p>';
        return;
    }
    // Use the provided URL directly. Caller is responsible for encoding.
    frame.src = src;
});

export {};

function getQueryParam(name: string): string | null {
    const params = new URLSearchParams(location.search);
    return params.get(name);
}

function base64EncodeUnicode(str: string) {
    return btoa(unescape(encodeURIComponent(str)));
}

let pdfDoc: any = null;
let currentPage = 1;
let pageRendering = false;
let pageNumPending: number | null = null;
let scale = 1.0;
// storage key used for saving/loading last page for the currently opened document
let currentStorageKey: string | null = null;

let canvas = document.getElementById('pdf-canvas') as HTMLCanvasElement | null;
let ctx = canvas ? canvas.getContext('2d') : null;

function renderPage(num: number) {
    console.log('viewer: renderPage', num, 'canvas?', !!canvas, 'ctx?', !!ctx, 'pdfDoc?', !!pdfDoc);
    if (!pdfDoc || !ctx || !canvas) return;
    pageRendering = true;
    pdfDoc.getPage(num).then((page: any) => {
        const viewport = page.getViewport({ scale });
        canvas!.height = viewport.height;
        canvas!.width = viewport.width;
        const renderContext = {
            canvasContext: ctx,
            viewport: viewport
        };
        const renderTask = page.render(renderContext);
        renderTask.promise.then(() => {
            pageRendering = false;
            document.getElementById('page-num')!.textContent = String(num);
            document.getElementById('page-count')!.textContent = String(pdfDoc.numPages);
            // save last page using the currentStorageKey (set when document was loaded)
            try {
                if (currentStorageKey) {
                    console.log('viewer: saving page', num, 'to key', currentStorageKey);
                    chrome.storage.local.set({ [currentStorageKey]: num }, () => { console.log('viewer: saved', currentStorageKey, num); });
                }
                else {
                    // fallback: compute from query param (non-file default)
                    const srcParam = getQueryParam('src') || '';
                    const srcDecoded2 = decodeURIComponent(srcParam);
                    const key2 = 'lastPage:' + base64EncodeUnicode(srcDecoded2);
                    console.log('viewer: saving page (fallback) to', key2, num);
                    chrome.storage.local.set({ [key2]: num }, () => { console.log('viewer: saved (fallback)', key2, num); });
                }
            }
            catch (e) { console.error('viewer: storage set error', e); }
            if (pageNumPending !== null) {
                renderPage(pageNumPending);
                pageNumPending = null;
            }
        });
    });
}

function queueRenderPage(num: number) {
    if (pageRendering) {
        pageNumPending = num;
    } else {
        renderPage(num);
    }
}

function onPrevPage() {
    if (currentPage <= 1) return;
    currentPage--;
    queueRenderPage(currentPage);
}

function onNextPage() {
    if (!pdfDoc) return;
    if (currentPage >= pdfDoc.numPages) return;
    currentPage++;
    queueRenderPage(currentPage);
}

function onZoomIn() {
    scale = scale + 0.25;
    queueRenderPage(currentPage);
}

function onZoomOut() {
    scale = Math.max(0.25, scale - 0.25);
    queueRenderPage(currentPage);
}

document.addEventListener('DOMContentLoaded', async () => {
    const src = getQueryParam('src');
    if (!src) {
        document.body.innerHTML = '<p>No PDF specified.</p>';
        return;
    }

    // Ensure pdf.js is loaded. Load it dynamically from extension resources if needed.
    if (!(window as any).pdfjsLib) {
        try {
            const pdfJsUrl = chrome.runtime.getURL('node_modules/pdfjs-dist/build/pdf.mjs');
            console.log('viewer: loading pdf.js from', pdfJsUrl);
            await new Promise<void>((resolve, reject) => {
                const s = document.createElement('script');
                s.src = pdfJsUrl;
                s.type = 'module';
                s.onload = () => { console.log('viewer: pdf.js loaded'); resolve(); };
                s.onerror = (e) => { console.error('viewer: error loading pdf.js', e); reject(e); };
                document.head.appendChild(s);
            });
        }
        catch (e) {
            console.error('viewer: could not load pdf.js, falling back to chooser', e);
            showLocalFileChooser();
            return;
        }
    }

    // Configure PDF.js worker with a robust URL (try runtime URL, then fetch+blob fallback)
    const pdfjsLib = (window as any).pdfjsLib;
    async function configureWorker(workerRelPath: string) {
        if (!pdfjsLib) return;
        try {
            const runtimeUrl = chrome.runtime.getURL(workerRelPath);
            // try to fetch the worker to ensure it's accessible
            const resp = await fetch(runtimeUrl, { method: 'GET' });
            if (resp.ok) {
                pdfjsLib.GlobalWorkerOptions.workerSrc = runtimeUrl;
                return;
            }
        }
        catch (e) {
            // ignore and try blob fallback
        }
        // fallback: try to fetch and create blob URL
        try {
            const resp2 = await fetch(chrome.runtime.getURL(workerRelPath));
            const text = await resp2.text();
            const blob = new Blob([text], { type: 'application/javascript' });
            const blobUrl = URL.createObjectURL(blob);
            pdfjsLib.GlobalWorkerOptions.workerSrc = blobUrl;
        }
        catch (e) {
            console.warn('viewer: could not configure PDF.js worker', e);
        }
    }
    if (pdfjsLib) {
        // worker path relative to extension root (declared in manifest.web_accessible_resources)
        await configureWorker('node_modules/pdfjs-dist/build/pdf.worker.mjs');
    }

    // normalize src and storage key
    const srcDecoded = decodeURIComponent(src);
    // If this is a local file URL, try to load directly if the extension has file-scheme access;
    // otherwise show a chooser.
    if (srcDecoded.startsWith('file://')) {
        try {
            if (chrome.extension && typeof chrome.extension.isAllowedFileSchemeAccess === 'function') {
                console.log('viewer: checking isAllowedFileSchemeAccess availability:', !!(chrome.extension && (chrome.extension as any).isAllowedFileSchemeAccess));
                chrome.extension.isAllowedFileSchemeAccess((isAllowed: boolean) => {
                    (async () => {
                        console.log('viewer: isAllowedFileSchemeAccess ->', isAllowed);
                        const pdfjsLibLocal = (window as any).pdfjsLib;
                        if (isAllowed && pdfjsLibLocal) {
                            try {
                                // attempt to load the file:// URL directly via PDF.js (no fetch check)
                                await configureWorker('node_modules/pdfjs-dist/build/pdf.worker.mjs');
                                const loadingTask = pdfjsLibLocal.getDocument(srcDecoded);
                                loadingTask.promise.then((doc: any) => {
                                    pdfDoc = doc;
                                    // use src-based key for file URLs
                                    const key = 'lastPage:' + base64EncodeUnicode(srcDecoded);
                                    currentStorageKey = key;
                                    console.log('viewer: file url allowed, currentStorageKey=', currentStorageKey);
                                    chrome.storage.local.get([key], (res: any) => {
                                        console.log('viewer: storage.get for file-url key result=', res);
                                        const last = res ? res[key] : null;
                                        document.getElementById('page-count')!.textContent = String(pdfDoc.numPages);
                                        currentPage = last ? last : 1;
                                        queueRenderPage(currentPage);
                                    });
                                }).catch((err: any) => {
                                    console.error('viewer: error loading file:// directly', err);
                                    // fallback to chooser below
                                    showLocalFileChooser();
                                });
                                return;
                            }
                            catch (e) {
                                console.warn('viewer: error during direct file load attempt', e);
                                showLocalFileChooser();
                                return;
                            }
                        }
                        // not allowed or pdfjs not available -> show chooser
                        showLocalFileChooser();
                    })();
                });
            }
            else {
                showLocalFileChooser();
            }
        }
        catch (e) {
            console.warn('viewer: error checking file-scheme access', e);
            showLocalFileChooser();
        }
        return;
    }

    // helper to render a file chooser UI and load a selected local file as blob
    function showLocalFileChooser() {
        document.body.innerHTML = `
            <div style="padding:16px; font-family: sans-serif;">
                <h2>Arquivo local detectado</h2>
                <p>Por restrições de segurança, a extensão não acessa automaticamente arquivos locais. Selecione o mesmo arquivo local manualmente para carregar no viewer.</p>
                <input id="local-file-input" type="file" accept="application/pdf" />
                <p style="margin-top:8px;">Ou habilite "Allow access to file URLs" para esta extensão nas configurações de extensões (chrome://extensions).</p>
            </div>
        `;
        // wait a bit for element to be parsed
        setTimeout(() => {
            const fi = document.getElementById('local-file-input') as HTMLInputElement | null;
            if (!fi) return;
            fi.addEventListener('change', async (ev) => {
                const files = fi.files;
                if (!files || files.length === 0) return;
                const file = files[0];
                const blobUrl = URL.createObjectURL(file);
                // use PDF.js to load blob URL
                const pdfjsLib2 = (window as any).pdfjsLib;
                if (pdfjsLib2) {
                    // try to configure worker for blob/file load as well
                    await configureWorker('node_modules/pdfjs-dist/build/pdf.worker.mjs');
                    const loadingTask = pdfjsLib2.getDocument(blobUrl);
                    loadingTask.promise.then((doc: any) => {
                        pdfDoc = doc;
                        // use file-based key: name|size|lastModified
                        const key = 'lastPage:file:' + base64EncodeUnicode(file.name + '|' + file.size + '|' + file.lastModified);
                        // set currentStorageKey so render/save uses the same key
                        currentStorageKey = key;
                        console.log('viewer: file selected, currentStorageKey=', currentStorageKey);
                        chrome.storage.local.get([key], (res: any) => {
                            console.log('viewer: storage.get for file key result=', res);
                            const last = res ? res[key] : null;
                            document.body.innerHTML = `
                                <div id="toolbar" style="display:flex; gap:8px; align-items:center; padding:8px; background:#f1f1f1;">
                                  <button id="prev">Anterior</button>
                                  <button id="next">Próxima</button>
                                  <span>Página <span id="page-num">0</span> / <span id="page-count">0</span></span>
                                  <button id="zoom-in">+</button>
                                  <button id="zoom-out">-</button>
                                </div>
                                <div id="viewer-container" style="height:calc(100% - 48px);">
                                  <canvas id="pdf-canvas"></canvas>
                                </div>
                            `;
                            // re-init canvas/context
                            canvas = document.getElementById('pdf-canvas') as HTMLCanvasElement | null;
                            ctx = canvas ? canvas.getContext('2d') : null;
                            if (canvas) {
                                canvas.width = canvas.clientWidth;
                            }
                            document.getElementById('page-count')!.textContent = String(pdfDoc.numPages);
                            console.log('viewer: loaded last page from storage for file=', last, 'type=', typeof last);
                            currentPage = last ? last : 1;
                            queueRenderPage(currentPage);
                            // wire controls
                            document.getElementById('prev')!.addEventListener('click', onPrevPage);
                            document.getElementById('next')!.addEventListener('click', onNextPage);
                            document.getElementById('zoom-in')!.addEventListener('click', onZoomIn);
                            document.getElementById('zoom-out')!.addEventListener('click', onZoomOut);
                        });
                    }).catch((err: any) => {
                        document.body.innerHTML = '<p>Erro ao carregar PDF local.</p>';
                        console.error(err);
                    });
                }
            });
        }, 50);
    }
    function base64EncodeUnicodeLocal(s: string) { return btoa(unescape(encodeURIComponent(s))); }
    const key = 'lastPage:' + base64EncodeUnicodeLocal(srcDecoded);
    // set currentStorageKey so render/save uses the same key
    currentStorageKey = key;
    console.log('viewer: loading last page for', srcDecoded, 'key=', key);
    chrome.storage.local.get([key], (res: any) => {
        console.log('viewer: storage.get result=', res);
        const last = res ? res[key] : null;
        const loadPage = (pnum: number) => {
            currentPage = pnum || 1;
            queueRenderPage(currentPage);
        };

        // load document using decoded src
        const loadingTask = (window as any).pdfjsLib.getDocument(srcDecoded);
        loadingTask.promise.then((doc: any) => {
            pdfDoc = doc;
            document.getElementById('page-count')!.textContent = String(pdfDoc.numPages);
            loadPage(last ? last : 1);
        }).catch((err: any) => {
            document.body.innerHTML = '<p>Erro ao carregar PDF.</p>';
            console.error(err);
        });
    });

    // wire controls
    document.getElementById('prev')!.addEventListener('click', onPrevPage);
    document.getElementById('next')!.addEventListener('click', onNextPage);
    document.getElementById('zoom-in')!.addEventListener('click', onZoomIn);
    document.getElementById('zoom-out')!.addEventListener('click', onZoomOut);
});

export {};

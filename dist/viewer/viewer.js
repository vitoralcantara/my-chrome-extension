function onPrevPage() {
    if (currentPage <= 1)
        return;
    currentPage--;
    queueRenderPage(currentPage);
    updatePageNum();
    console.log('onPrevPage clicado', { currentPage });
}
function onNextPage() {
    if (!pdfDoc || currentPage >= pdfDoc.numPages)
        return;
    currentPage++;
    queueRenderPage(currentPage);
    updatePageNum();
    console.log('onNextPage clicado', { currentPage });
}
function onZoomIn() {
    scale = Math.min(scale + 0.2, 3.0);
    queueRenderPage(currentPage);
    console.log('onZoomIn clicado', { scale });
}
function onZoomOut() {
    scale = Math.max(scale - 0.2, 0.5);
    queueRenderPage(currentPage);
    console.log('onZoomOut clicado', { scale });
}
function updatePageNum() {
    const pageNumEl = document.getElementById('page-num');
    if (pageNumEl)
        pageNumEl.textContent = String(currentPage);
}
function getQueryParam(name) {
    console.log('viewer.js carregado');
    const params = new URLSearchParams(location.search);
    return params.get(name);
}
function base64EncodeUnicode(str) {
    return btoa(unescape(encodeURIComponent(str)));
}
let pdfDoc = null;
let currentPage = 1;
let pageRendering = false;
let pageNumPending = null;
let scale = 1.0;
// storage key used for saving/loading last page for the currently opened document
let currentStorageKey = null;
let canvas = document.getElementById('pdf-canvas');
let ctx = canvas ? canvas.getContext('2d') : null;
// srcDecoded: decoded PDF URL from query param
let srcDecoded = '';
document.addEventListener('DOMContentLoaded', () => {
    // Configura o caminho do worker do PDF.js
    if (typeof window.pdfjsLib !== 'undefined') {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = '../../node_modules/pdfjs-dist/build/pdf.worker.mjs';
    }
    console.log('DOMContentLoaded: registrando listeners dos botões');
    // Get PDF src from query param
    const srcParam = getQueryParam('src');
    if (srcParam) {
        try {
            srcDecoded = decodeURIComponent(srcParam);
        }
        catch (e) {
            srcDecoded = srcParam;
        }
    }
    // Register button listeners
    const prevBtn = document.getElementById('prev');
    const nextBtn = document.getElementById('next');
    const zoomInBtn = document.getElementById('zoom-in');
    const zoomOutBtn = document.getElementById('zoom-out');
    if (prevBtn)
        prevBtn.addEventListener('click', onPrevPage);
    if (nextBtn)
        nextBtn.addEventListener('click', onNextPage);
    if (zoomInBtn)
        zoomInBtn.addEventListener('click', onZoomIn);
    if (zoomOutBtn)
        zoomOutBtn.addEventListener('click', onZoomOut);
    // ...existing code for PDF loading and rendering...
    // The rest of your PDF loading logic can use srcDecoded
    function base64EncodeUnicodeLocal(s) { return btoa(unescape(encodeURIComponent(s))); }
    const key = 'lastPage:' + base64EncodeUnicodeLocal(srcDecoded);
    currentStorageKey = key;
    console.log('viewer: loading last page for', srcDecoded, 'key=', key);
    // Usa o DOM já existente do viewer.html
    canvas = document.getElementById('pdf-canvas');
    ctx = canvas ? canvas.getContext('2d') : null;
    if (canvas) {
        canvas.width = canvas.clientWidth;
    }
    // Agora carrega o PDF e renderiza
    chrome.storage.local.get([key], (res) => {
        console.log('viewer: storage.get result=', res);
        const last = res ? res[key] : null;
        const loadingTask = window.pdfjsLib.getDocument(srcDecoded);
        loadingTask.promise.then((doc) => {
            pdfDoc = doc;
            document.getElementById('page-count').textContent = String(pdfDoc.numPages);
            currentPage = last ? last : 1;
            queueRenderPage(currentPage);
            // Aguarda o DOM estar pronto para registrar os listeners
            setTimeout(() => {
                const prevBtn = document.getElementById('prev');
                const nextBtn = document.getElementById('next');
                const zoomInBtn = document.getElementById('zoom-in');
                const zoomOutBtn = document.getElementById('zoom-out');
                console.log('Registrando listeners após renderização:', { prevBtn, nextBtn, zoomInBtn, zoomOutBtn });
                if (prevBtn)
                    prevBtn.addEventListener('click', onPrevPage);
                if (nextBtn)
                    nextBtn.addEventListener('click', onNextPage);
                if (zoomInBtn)
                    zoomInBtn.addEventListener('click', onZoomIn);
                if (zoomOutBtn)
                    zoomOutBtn.addEventListener('click', onZoomOut);
            }, 100);
        }).catch((err) => {
            document.body.innerHTML = '<p>Erro ao carregar PDF.</p>';
            console.error(err);
        });
    });
});
function queueRenderPage(pageNum) {
    pageRendering = true;
    if (!pdfDoc)
        return;
    pdfDoc.getPage(pageNum).then((page) => {
        const viewport = page.getViewport({ scale });
        if (canvas) {
            canvas.height = viewport.height;
            canvas.width = viewport.width;
            const renderContext = {
                canvasContext: ctx,
                viewport: viewport
            };
            page.render(renderContext).promise.then(() => {
                pageRendering = false;
                updatePageNum();
            });
        }
    });
    console.log('queueRenderPage called for page', pageNum);
}
export {};

const resultPhoto = document.getElementById('result-photo');
const photoPlaceholder = document.getElementById('photo-placeholder');
const yesButton = document.getElementById('yes-button');

const processingOverlay = document.getElementById('processing-overlay');
const processingStatus = document.getElementById('processing-status');
const processingError = document.getElementById('processing-error');
const processingErrorMessage = document.getElementById('processing-error-message');
const retryButton = document.getElementById('retry-button');

const photoDataUrl = sessionStorage.getItem('capturedPhoto');

const STATUS_TEXT = {
    uploading: 'Enviando imagem...',
    queued: 'Na fila. Aguardando início do processamento...',
    processing: 'Processando imagem...',
    done: 'Imagem pronta!',
};

ImageGenerator.configure({
    baseApi: 'https://dbdemo.dbpe.com.br/api',
});

if (photoDataUrl) {
    resultPhoto.addEventListener('load', () => {
        photoPlaceholder.hidden = true;
        resultPhoto.hidden = false;
    });
    resultPhoto.addEventListener('error', () => {
        console.error('Falha ao carregar a foto capturada.');
    });
    resultPhoto.src = photoDataUrl;
} else {
    console.warn('Nenhuma foto encontrada no sessionStorage.');
}

function dataUrlToFile(dataUrl, filename) {
    const [header, base64Data] = dataUrl.split(',');
    const mimeMatch = header.match(/data:(.*?);base64/);
    const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';

    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }

    return new File([bytes], filename, { type: mimeType });
}

function showProcessingOverlay() {
    processingError.hidden = true;
    processingStatus.hidden = false;
    processingStatus.textContent = STATUS_TEXT.uploading;
    processingOverlay.hidden = false;
}

function showProcessingError(message) {
    processingStatus.hidden = true;
    processingErrorMessage.textContent = message;
    processingError.hidden = false;
}

async function processImage() {
    const file = dataUrlToFile(photoDataUrl, 'foto.jpg');

    const imageUrl = await ImageGenerator.generate(file, {
        onStatusChange: (status) => {
            processingStatus.textContent = STATUS_TEXT[status] || `Status: ${status}`;
        },
    });

    sessionStorage.setItem('processedImageUrl', imageUrl);
    window.location.href = '/qrfoto';
}

async function startProcessing(isAutoRetry = false) {
    if (!photoDataUrl) {
        return;
    }

    showProcessingOverlay();

    try {
        await processImage();
    } catch (err) {
        console.error('Erro ao processar imagem:', err);

        if (!isAutoRetry) {
            // Backends de inferência (ComfyUI) costumam falhar na primeira
            // chamada por "cold start"; tenta uma vez mais antes de expor o erro.
            startProcessing(true);
            return;
        }

        showProcessingError(err.message || 'Ocorreu um erro ao processar a imagem.');
    }
}

yesButton.addEventListener('click', (event) => {
    event.preventDefault();
    startProcessing();
});

retryButton.addEventListener('click', () => {
    startProcessing();
});

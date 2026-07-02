const resultPhoto = document.getElementById('result-photo');
const photoPlaceholder = document.getElementById('photo-placeholder');
const photoDataUrl = sessionStorage.getItem('capturedPhoto');

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

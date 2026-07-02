const resultPhoto = document.getElementById('result-photo');
const photoDataUrl = sessionStorage.getItem('capturedPhoto');

if (photoDataUrl) {
    resultPhoto.src = photoDataUrl;
}

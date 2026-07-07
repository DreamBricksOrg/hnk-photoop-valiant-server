const video = document.getElementById('camera-stream');
const canvas = document.getElementById('photo-canvas');
const captureButton = document.getElementById('capture-button');

captureButton.disabled = true;

async function startCamera() {
    const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false
    });
    video.srcObject = stream;
    video.addEventListener('loadedmetadata', () => {
        captureButton.disabled = false;
    });
}

function flashScreen() {
    const flash = document.createElement('div');
    flash.style.position = 'fixed';
    flash.style.inset = '0';
    flash.style.backgroundColor = 'rgb(255, 248, 230)';
    flash.style.zIndex = '9999';
    flash.style.opacity = '1';
    flash.style.pointerEvents = 'none';
    flash.style.transition = 'opacity 0.4s ease-out';
    document.body.appendChild(flash);

    setTimeout(() => {
        flash.style.opacity = '0';
    }, 400);

    setTimeout(() => flash.remove(), 800);
}

function capturePhoto() {
    if (!video.videoWidth || !video.videoHeight) {
        return;
    }

    flashScreen();

    const targetRatio = 9 / 16;
    const videoWidth = video.videoWidth;
    const videoHeight = video.videoHeight;

    let cropWidth = videoWidth;
    let cropHeight = videoWidth / targetRatio;

    if (cropHeight > videoHeight) {
        cropHeight = videoHeight;
        cropWidth = videoHeight * targetRatio;
    }

    const cropX = (videoWidth - cropWidth) / 2;
    const cropY = (videoHeight - cropHeight) / 2;

    canvas.width = cropWidth;
    canvas.height = cropHeight;

    const context = canvas.getContext('2d');
    context.drawImage(video, cropX, cropY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);

    const photoDataUrl = canvas.toDataURL('image/jpeg', 0.9);
    sessionStorage.setItem('capturedPhoto', photoDataUrl);

    setTimeout(() => {
        window.location.href = '/resultado';
    }, 500);
}

captureButton.addEventListener('click', capturePhoto);

startCamera();

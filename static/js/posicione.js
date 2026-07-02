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

function capturePhoto() {
    if (!video.videoWidth || !video.videoHeight) {
        return;
    }

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

    window.location.href = '/resultado';
}

captureButton.addEventListener('click', capturePhoto);

startCamera();

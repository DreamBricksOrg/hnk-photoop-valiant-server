const video = document.getElementById('camera-stream');
const canvas = document.getElementById('photo-canvas');
const captureButton = document.getElementById('capture-button');
const countdownOverlay = document.getElementById('countdown-overlay');
const countdownNumber = document.getElementById('countdown-number');

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

function runCountdown(seconds) {
    return new Promise((resolve) => {
        let remaining = seconds;
        countdownNumber.textContent = remaining;
        countdownOverlay.hidden = false;

        const interval = setInterval(() => {
            remaining -= 1;

            if (remaining <= 0) {
                clearInterval(interval);
                countdownOverlay.hidden = true;
                resolve();
                return;
            }

            // Reinicia a animação de pulso a cada número.
            countdownNumber.style.animation = 'none';
            void countdownNumber.offsetWidth;
            countdownNumber.style.animation = '';
            countdownNumber.textContent = remaining;
        }, 1000);
    });
}

function flashScreen(durationMs, fadeMs, onFlashVisible) {
    return new Promise((resolve) => {
        const flash = document.createElement('div');
        flash.style.position = 'fixed';
        flash.style.inset = '0';
        flash.style.backgroundColor = 'rgb(255, 248, 230)';
        flash.style.zIndex = '9999';
        flash.style.opacity = '1';
        flash.style.pointerEvents = 'none';
        flash.style.transition = `opacity ${fadeMs}ms ease-out`;
        document.body.appendChild(flash);

        // Captura no meio do período em que o flash está 100% opaco (antes
        // de começar a esmaecer), garantindo que o flash esteja bem visível
        // no momento exato da foto.
        const opaqueDurationMs = durationMs - fadeMs;
        const captureAtMs = opaqueDurationMs / 2;

        setTimeout(() => {
            onFlashVisible && onFlashVisible();
        }, captureAtMs);

        setTimeout(() => {
            flash.style.opacity = '0';
        }, opaqueDurationMs);

        setTimeout(() => {
            flash.remove();
            resolve();
        }, durationMs);
    });
}

function takePhoto() {
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
}

async function capturePhoto() {
    captureButton.disabled = true;

    await runCountdown(5);
    await flashScreen(1500, 300, takePhoto);

    window.location.href = '/resultado';
}

captureButton.addEventListener('click', capturePhoto);

startCamera();

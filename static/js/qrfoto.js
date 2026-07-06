const resultPhoto = document.getElementById('result-photo');
const photoPlaceholder = document.getElementById('photo-placeholder');
const qrCodeCanvas = document.getElementById('qr-code-canvas');
const endButton = document.getElementById('end-button');

const processedImageUrl = sessionStorage.getItem('processedImageUrl');

if (processedImageUrl) {
    resultPhoto.addEventListener('load', () => {
        photoPlaceholder.hidden = true;
        resultPhoto.hidden = false;
    });
    resultPhoto.addEventListener('error', () => {
        console.error('Falha ao carregar a foto processada.');
    });
    resultPhoto.src = processedImageUrl;

    const fotoPageUrl = `https://go.dbpe.com.br/hnk/foto?imageUrl=${encodeURIComponent(processedImageUrl)}`;

    QRCode.toCanvas(qrCodeCanvas, fotoPageUrl, {
        margin: 0,
        color: {
            dark: '#ffffffff',
            light: '#00000000',
        },
    }, (err) => {
        if (err) {
            console.error('Falha ao gerar o QR Code.', err);
        }
    });
} else {
    console.warn('Nenhuma foto processada encontrada no sessionStorage.');
}

endButton.addEventListener('click', () => {
    sessionStorage.clear();
});

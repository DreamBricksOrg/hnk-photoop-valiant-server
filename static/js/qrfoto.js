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

    // A URL completa da imagem é longa (.../image/output/{id}/{arquivo}.png)
    // e deixa o QR code denso/difícil de ler. Só o id da pasta é enviado; a
    // tela /foto busca a URL completa via GET /api/image/{id}.
    const idMatch = processedImageUrl.match(/\/output\/([^/]+)\//);
    const imageId = idMatch ? idMatch[1] : '';

    if (!imageId) {
        console.warn('Não foi possível extrair o id da imagem de', processedImageUrl);
    }

    const fotoPageUrl = `https://go.dbpe.com.br/hnk?id=${encodeURIComponent(imageId)}`;

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

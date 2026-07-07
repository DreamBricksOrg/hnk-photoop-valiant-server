const resultPhoto = document.getElementById('result-photo');
const photoPlaceholder = document.getElementById('photo-placeholder');
const downloadButton = document.getElementById('download-button');
const shareButton = document.getElementById('share-button');

const API_BASE = 'https://dbdemo.dbpe.com.br';
const FILE_NAME = 'foto_heineken.png';

const imageId = new URLSearchParams(window.location.search).get('id');

let imageUrl = null;

downloadButton.disabled = true;
shareButton.disabled = true;

async function resolveImageUrl() {
    if (!imageId) {
        console.warn('Nenhum id de imagem informado na URL.');
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/api/image/${encodeURIComponent(imageId)}`);
        if (!response.ok) {
            throw new Error(`Falha ao buscar imagem (HTTP ${response.status})`);
        }

        const data = await response.json();
        if (!data.image_url) {
            throw new Error('Resposta sem image_url.');
        }

        imageUrl = data.image_url.startsWith('http') ? data.image_url : `${API_BASE}${data.image_url}`;

        resultPhoto.addEventListener('load', () => {
            photoPlaceholder.hidden = true;
            resultPhoto.hidden = false;
        });
        resultPhoto.addEventListener('error', () => {
            console.error('Falha ao carregar a foto.');
        });
        resultPhoto.src = imageUrl;

        downloadButton.disabled = false;
        shareButton.disabled = false;
    } catch (err) {
        console.error('Erro ao buscar a foto:', err);
    }
}

async function fetchImageBlob() {
    const response = await fetch(imageUrl, {
        mode: 'cors',
        headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' },
    });
    if (!response.ok) {
        throw new Error(`Falha ao baixar a imagem (HTTP ${response.status})`);
    }
    return response.blob();
}

downloadButton.addEventListener('click', async () => {
    try {
        const blob = await fetchImageBlob();
        const blobUrl = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = FILE_NAME;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(blobUrl);
    } catch (err) {
        console.error('Erro ao baixar a foto:', err);
    }
});

shareButton.addEventListener('click', async () => {
    try {
        const blob = await fetchImageBlob();
        const file = new File([blob], FILE_NAME, { type: blob.type || 'image/png' });

        if (navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({ files: [file], title: 'Minha foto Heineken' });
            return;
        }
    } catch (err) {
        if (err.name === 'AbortError') {
            return;
        }
        console.error('Erro ao compartilhar o arquivo:', err);
    }

    if (navigator.share) {
        try {
            await navigator.share({ title: 'Minha foto Heineken', url: window.location.href });
        } catch (err) {
            if (err.name !== 'AbortError') {
                console.error('Erro ao compartilhar:', err);
            }
        }
    } else {
        console.warn('Compartilhamento não suportado neste navegador.');
    }
});

resolveImageUrl();

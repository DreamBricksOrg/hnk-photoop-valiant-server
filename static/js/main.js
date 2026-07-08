console.log("Photoop Valiant loaded");

function isFullscreen() {
    return !!(
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement
    );
}

function requestFullscreen() {
    const el = document.documentElement;
    const request =
        el.requestFullscreen ||
        el.webkitRequestFullscreen ||
        el.mozRequestFullScreen ||
        el.msRequestFullscreen;

    if (!request || isFullscreen()) {
        return;
    }

    request.call(el).catch(() => {
        // Navegadores exigem um gesto do usuário para tela cheia; falha
        // silenciosa aqui é esperada quando chamado sem interação.
    });
}

// Tenta entrar em tela cheia assim que a página carrega (funciona em
// navegadores/kiosks que permitem, senão falha silenciosamente).
document.addEventListener('DOMContentLoaded', requestFullscreen);

// Recupera a tela cheia a qualquer momento clicando no logo.
document.addEventListener('DOMContentLoaded', () => {
    const logo = document.querySelector('.logo');
    if (logo) {
        logo.style.cursor = 'pointer';
        logo.addEventListener('click', requestFullscreen);
    }
});

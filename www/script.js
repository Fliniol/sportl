const isElectron = typeof window.require === 'function';
const IP_DO_SEU_PC = '192.168.10.110';

const BASE_URL = isElectron ? 'http://localhost:3000' : `http://${IP_DO_SEU_PC}:3000`;
const API_URL = `${BASE_URL}/api/musicas`;

let playlist = [];
let playlistOffline = [];
let usandoServidorRemoto = false;
let indiceAtual = 0;
let isRandom = false;

const audio = new Audio();
audio.volume = 0.5;

const albumArt = document.getElementById('album-art');
const durationBadge = document.getElementById('duration-badge');
const playPauseButton = document.getElementById('playPauseButton');
const playPauseImg = document.getElementById('playPauseImg');
const nextButton = document.getElementById('nextButton');
const previousButton = document.getElementById('previousButton');
const shuffleButton = document.getElementById('shuffleButton');
const shuffleImg = document.getElementById('shuffleImg');
const progressBar = document.getElementById('progress-bar');
const currentTimeEl = document.getElementById('current-time');
const totalDurationEl = document.getElementById('total-duration');
const volumeSlider = document.getElementById('volume');

function formatarTempo(segundos) {
    if (isNaN(segundos)) return "00:00";
    const minutos = Math.floor(segundos / 60);
    const segundosRestantes = Math.floor(segundos % 60);
    return `${minutos}:${segundosRestantes < 10 ? '0' : ''}${segundosRestantes}`;
}

function montarUrlSegura(caminhoRelativo) {
    const codificado = caminhoRelativo.split('/').map(encodeURIComponent).join('/');
    if (!isElectron && usandoServidorRemoto) {
        return `${BASE_URL}/${codificado}`;
    }
    return codificado;
}

function carregarMusica(indice) {
    if (!playlist.length || !playlist[indice]) return;
    const musicaAtual = playlist[indice];

    audio.src = montarUrlSegura(musicaAtual.url);
    albumArt.src = montarUrlSegura(musicaAtual.imagem);

    if (durationBadge) {
        durationBadge.textContent = musicaAtual.duracao;
    }
    progressBar.value = 0;
    currentTimeEl.textContent = "00:00";
}

async function buscarAPIComTimeout(ms = 1500) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), ms);
    try {
        const res = await fetch(API_URL, { signal: controller.signal });
        clearTimeout(timer);
        if (!res.ok) throw new Error('Falha HTTP');
        return await res.json();
    } catch (e) {
        clearTimeout(timer);
        return null;
    }
}

async function inicializarPlayer() {
    if (isElectron) {
        const dadosPC = await buscarAPIComTimeout(3000);
        if (dadosPC && dadosPC.length > 0) {
            playlist = dadosPC;
            carregarMusica(indiceAtual);
        }
        return;
    }

    // 1. No celular: carrega o banco interno imediatamente (funciona com PC desligado)
    try {
        const resLocal = await fetch('playlist.json');
        playlistOffline = await resLocal.json();
        if (playlistOffline.length > 0) {
            usandoServidorRemoto = false;
            playlist = playlistOffline;
            carregarMusica(indiceAtual);
        }
    } catch (erroLocal) {
        console.error("Erro ao ler playlist offline:", erroLocal);
    }

    // 2. Verifica em segundo plano se o PC está ligado para buscar músicas novas
    const dadosRemotos = await buscarAPIComTimeout(1500);
    if (dadosRemotos && dadosRemotos.length > 0) {
        usandoServidorRemoto = true;
        playlist = dadosRemotos;
        if (audio.paused && audio.currentTime === 0) {
            carregarMusica(indiceAtual);
        }
    }
}

if (isElectron) {
    const { ipcRenderer } = window.require('electron');
    document.getElementById('closeButton')?.addEventListener('click', () => ipcRenderer.send('fechar-app'));
    document.getElementById('minimizeButton')?.addEventListener('click', () => ipcRenderer.send('minimizar-app'));
} else {
    document.body.classList.add('modo-celular');
    const winControls = document.querySelector('.window-controls');
    if (winControls) winControls.style.display = 'none';
}

inicializarPlayer();

// Se o PC for desligado no meio do uso, cai automaticamente para o arquivo interno
audio.addEventListener('error', () => {
    if (!isElectron && usandoServidorRemoto && playlistOffline.length > 0) {
        usandoServidorRemoto = false;
        playlist = playlistOffline;
        indiceAtual = indiceAtual % playlist.length;
        carregarMusica(indiceAtual);
        audio.play().catch(() => {});
    }
});

playPauseButton.addEventListener('click', () => {
    if (!playlist.length) return;
    if (audio.paused) {
        audio.play().then(() => {
            playPauseImg.src = "imagens/Pause.png";
        }).catch(err => console.error("Erro ao reproduzir:", err));
    } else {
        audio.pause();
        playPauseImg.src = "imagens/Play.png";
    }
});

async function proximaMusica() {
    if (!isElectron) {
        const dadosRemotos = await buscarAPIComTimeout(1200);
        if (dadosRemotos && dadosRemotos.length > 0) {
            usandoServidorRemoto = true;
            playlist = dadosRemotos;
        } else if (playlistOffline.length > 0) {
            usandoServidorRemoto = false;
            playlist = playlistOffline;
        }
    }

    if (!playlist.length) return;

    if (isRandom) {
        let novoIndice;
        do {
            novoIndice = Math.floor(Math.random() * playlist.length);
        } while (novoIndice === indiceAtual && playlist.length > 1);
        indiceAtual = novoIndice;
    } else {
        indiceAtual = (indiceAtual + 1) % playlist.length;
    }

    carregarMusica(indiceAtual);
    audio.play().then(() => {
        playPauseImg.src = "imagens/Pause.png";
    }).catch(err => console.error(err));
}

nextButton.addEventListener('click', proximaMusica);

previousButton.addEventListener('click', () => {
    if (!playlist.length) return;
    indiceAtual = indiceAtual - 1 < 0 ? playlist.length - 1 : indiceAtual - 1;
    carregarMusica(indiceAtual);
    audio.play().then(() => {
        playPauseImg.src = "imagens/Pause.png";
    }).catch(err => console.error(err));
});

shuffleButton.addEventListener('click', () => {
    isRandom = !isRandom;
    shuffleButton.style.opacity = isRandom ? "1" : "0.6";
    shuffleImg.style.filter = isRandom ? "drop-shadow(0 0 4px #1db954)" : "none";
});

audio.addEventListener('ended', proximaMusica);

audio.addEventListener('timeupdate', () => {
    if (audio.duration) {
        progressBar.value = (audio.currentTime / audio.duration) * 100;
        currentTimeEl.textContent = formatarTempo(audio.currentTime);
        totalDurationEl.textContent = formatarTempo(audio.duration);
    }
});

progressBar.addEventListener('input', () => {
    if (audio.duration) {
        audio.currentTime = (progressBar.value / 100) * audio.duration;
    }
});

volumeSlider.addEventListener('input', (e) => {
    audio.volume = e.target.value / 100;
});
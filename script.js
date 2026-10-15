// 1. Playlist estruturada com objetos (Áudio, Imagem e Duração)
const playlist = [
    {
        url: "musicas/4KGUTO - BORDERLINE.mp3",
        imagem: "imagens/20230118_100321.jpg",
        duracao: "3:45"
    },
    {
        url: "musicas/Kali Uchis – telepatía [Official Music Video].mp3",
        imagem: "imagens/4db211657da3062c85ec9306bdedacc8.png",
        duracao: "2:30"
    },
    {
        url: "musicas/Ela Só Pensa em Beijar (1965).mp3",
        imagem: "imagens/IMG_20200919_104532.jpg",
        duracao: "4:12"
    },
    {
        url: "musicas/Popotão Grandão (1982).mp3",
        imagem: "imagens/IMG_20201011_130939.jpg",
        duracao: "3:15"
    },
    {
        url: "musicas/MC L da Vinte - Vida Louca (Prod. DJ Will 22) [Clipe Oficial].mp3",
        imagem: "imagens/IMG_20201009_152122.jpg",
        duracao: "3:50"
    }
];

let indiceAtual = 0;

// Seletores do DOM
const audio = new Audio();
const albumArt = document.getElementById('album-art');
const durationBadge = document.getElementById('duration-badge');
const playPauseButton = document.getElementById('playPauseButton');
const playPauseImg = document.getElementById('playPauseImg');
const nextButton = document.getElementById('nextButton');
const previousButton = document.getElementById('previousButton');

// Função para carregar a música atual na interface
function carregarMusica(indice) {
    const musicaAtual = playlist[indice];
    audio.src = musicaAtual.url;
    albumArt.src = musicaAtual.imagem;
    durationBadge.textContent = musicaAtual.duracao;
}

// Inicializa a primeira música
carregarMusica(indiceAtual);

// Lógica do botão único de Play / Pause alternado
playPauseButton.addEventListener('click', () => {
    if (audio.paused) {
        audio.play();
        playPauseImg.src = "imagens/Pause.png"; // Altera para o ícone de pausar quando está a tocar
    } else {
        audio.pause();
        playPauseImg.src = "imagens/Pause.png"; // Ou altere para um ícone de "Play.png" se tiver criado um
    }
});

// Botão Próxima (Next)
nextButton.addEventListener('click', () => {
    indiceAtual++;
    if (indiceAtual >= playlist.length) {
        indiceAtual = 0;
    }
    carregarMusica(indiceAtual);
    audio.play();
    playPauseImg.src = "imagens/Pause.png";
});

// Botão Anterior (Previous)
previousButton.addEventListener('click', () => {
    indiceAtual--;
    if (indiceAtual < 0) {
        indiceAtual = playlist.length - 1;
    }
    carregarMusica(indiceAtual);
    audio.play();
    playPauseImg.src = "imagens/Pause.png";
});

// Passa para a próxima automaticamente quando terminar
audio.addEventListener('ended', () => {
    indiceAtual++;
    if (indiceAtual >= playlist.length) {
        indiceAtual = 0;
    }
    carregarMusica(indiceAtual);
    audio.play();
});

// Comunicação com o Electron para Fechar e Minimizar
const { ipcRenderer } = require('electron');
const closeButton = document.getElementById('closeButton');
const minimizeButton = document.getElementById('minimizeButton');

if (closeButton) {
    closeButton.addEventListener('click', () => {
        ipcRenderer.send('fechar-app');
    });
}

if (minimizeButton) {
    minimizeButton.addEventListener('click', () => {
        ipcRenderer.send('minimizar-app');
    });
}

const volumeSlider = document.getElementById('volume');

// Fica escutando quando o utilizador arrasta a barra de volume
volumeSlider.addEventListener('input', (e) => {
    // O valor do input vai de 0 a 100, dividimos por 100 para ficar entre 0.0 e 1.0
    audio.volume = e.target.value / 100;
});
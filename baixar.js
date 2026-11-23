const YTDlpWrap = require('yt-dlp-wrap').default;
const fs = require('fs');
const path = require('path');
const db = require('./database');

const urlPlaylist = 'https://www.youtube.com/watch?v=61DuxyCwziI&list=PLcAG6L_WjUW6D0MXitb2z50_vIfBzlCj7&pp=sAgC';
const pastaDestino = './musicas';

if (!fs.existsSync(pastaDestino)) {
    fs.mkdirSync(pastaDestino);
}

async function baixarMusicas() {
    try {
        console.log('A garantir que o motor do yt-dlp está pronto...');
        const ytDlpWrap = new YTDlpWrap();

        console.log('A iniciar o download e a conversão das músicas do YouTube...');
        await ytDlpWrap.exec([
            urlPlaylist,
            '-x',
            '--audio-format', 'mp3',
            '-o', `${pastaDestino}/%(title)s.%(ext)s`
        ]);

        console.log('Sucesso! A registar músicas novas no banco SQLite...');

        fs.readdir(pastaDestino, (err, arquivos) => {
            if (err) return console.error(err);
            const apenasMp3 = arquivos.filter(arq => path.extname(arq).toLowerCase() === '.mp3');

            db.all("SELECT url FROM musicas", [], (erroDb, rows) => {
                if (erroDb) return console.error(erroDb);
                const jaExistem = new Set(rows.map(r => r.url));
                const stmt = db.prepare("INSERT INTO musicas (titulo, url, imagem, duracao) VALUES (?, ?, ?, ?)");
                let novas = 0;

                apenasMp3.forEach(arq => {
                    const urlRelativa = `musicas/${arq}`;
                    if (!jaExistem.has(urlRelativa)) {
                        stmt.run(path.basename(arq, '.mp3'), urlRelativa, 'imagens/Pause.png', '0:00');
                        novas++;
                    }
                });

                stmt.finalize(() => {
                    console.log(`Concluído! ${novas} nova(s) música(s) adicionada(s) ao banco.`);
                });
            });
        });
    } catch (erro) {
        console.error('Erro ao processar:', erro);
    }
}

baixarMusicas();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const db = require('./database');

function iniciarServidor(porta = 3000) {
    const api = express();
    api.use(cors());
    api.use(express.json());

    // Serve as pastas de músicas e imagens na rede para o APK Android reproduzir
    api.use('/musicas', express.static(path.join(__dirname, 'musicas')));
    api.use('/imagens', express.static(path.join(__dirname, 'imagens')));

    api.get('/api/musicas', (req, res) => {
        db.all("SELECT * FROM musicas ORDER BY id ASC", [], (err, rows) => {
            if (err) return res.status(500).json({ erro: err.message });
            res.json(rows);
        });
    });

    api.post('/api/musicas', (req, res) => {
        const { titulo, url, imagem, duracao } = req.body;
        if (!url || !imagem) {
            return res.status(400).json({ erro: "Os campos 'url' e 'imagem' são obrigatórios." });
        }
        db.run(
            "INSERT INTO musicas (titulo, url, imagem, duracao) VALUES (?, ?, ?, ?)",
            [titulo || path.basename(url, '.mp3'), url, imagem, duracao || "0:00"],
            function (err) {
                if (err) return res.status(500).json({ erro: err.message });
                res.status(201).json({ id: this.lastID, titulo, url, imagem, duracao });
            }
        );
    });

    api.put('/api/musicas/:id', (req, res) => {
        const { titulo, url, imagem, duracao } = req.body;
        db.run(
            "UPDATE musicas SET titulo = ?, url = ?, imagem = ?, duracao = ? WHERE id = ?",
            [titulo, url, imagem, duracao, req.params.id],
            function (err) {
                if (err) return res.status(500).json({ erro: err.message });
                res.json({ atualizado: this.changes });
            }
        );
    });

    api.delete('/api/musicas/:id', (req, res) => {
        db.run("DELETE FROM musicas WHERE id = ?", [req.params.id], function (err) {
            if (err) return res.status(500).json({ erro: err.message });
            res.json({ removido: this.changes });
        });
    });

    api.post('/api/musicas/sincronizar', (req, res) => {
        const pastaMusicas = path.resolve(__dirname, 'musicas');
        if (!fs.existsSync(pastaMusicas)) return res.json({ adicionadas: 0 });

        const arquivos = fs.readdirSync(pastaMusicas).filter(f => f.toLowerCase().endsWith('.mp3'));
        db.all("SELECT url FROM musicas", [], (err, rows) => {
            if (err) return res.status(500).json({ erro: err.message });
            const cadastradas = new Set(rows.map(r => r.url));
            let adicionadas = 0;

            const stmt = db.prepare("INSERT INTO musicas (titulo, url, imagem, duracao) VALUES (?, ?, ?, ?)");
            arquivos.forEach(arq => {
                const caminhoRelativo = `musicas/${arq}`;
                if (!cadastradas.has(caminhoRelativo)) {
                    stmt.run(path.basename(arq, '.mp3'), caminhoRelativo, 'imagens/Pause.png', '0:00');
                    adicionadas++;
                }
            });
            stmt.finalize(() => res.json({ adicionadas }));
        });
    });

    api.get('/admin', (req, res) => {
        res.send(`
            <!DOCTYPE html>
            <html lang="pt-br">
            <head>
                <meta charset="UTF-8">
                <title>Gerenciador Spotiglke DB</title>
                <style>
                    body { font-family: 'Segoe UI', sans-serif; background: #181818; color: #fff; padding: 30px; max-width: 850px; margin: auto; }
                    h2 { color: #1db954; }
                    form, .toolbar { background: #282828; padding: 15px; border-radius: 8px; margin-bottom: 20px; display: flex; gap: 10px; flex-wrap: wrap; }
                    input { padding: 8px; border-radius: 4px; border: 1px solid #444; background: #121212; color: #fff; flex: 1; min-width: 180px; }
                    button { background: #1db954; color: #fff; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-weight: bold; }
                    button.del { background: #e53935; }
                    table { width: 100%; border-collapse: collapse; background: #282828; border-radius: 8px; overflow: hidden; }
                    th, td { padding: 10px; text-align: left; border-bottom: 1px solid #383838; font-size: 14px; }
                </style>
            </head>
            <body>
                <h2>Painel do Banco de Dados - Spotiglke</h2>
                <div class="toolbar">
                    <button onclick="sincronizar()">Escanear pasta ./musicas automaticamente</button>
                </div>
                <form onsubmit="adicionar(event)">
                    <input id="titulo" placeholder="Título da música" required>
                    <input id="url" placeholder="Caminho MP3 (ex: musicas/som.mp3)" required>
                    <input id="imagem" placeholder="Caminho Capa (ex: imagens/capa.jpg)" required>
                    <input id="duracao" placeholder="Duração (ex: 3:30)" style="max-width:120px">
                    <button type="submit">Salvar no Banco</button>
                </form>
                <table>
                    <thead><tr><th>ID</th><th>Título</th><th>Arquivo MP3</th><th>Capa</th><th>Ação</th></tr></thead>
                    <tbody id="lista"></tbody>
                </table>
                <script>
                    async function carregar() {
                        const res = await fetch('/api/musicas');
                        const dados = await res.json();
                        document.getElementById('lista').innerHTML = dados.map(m => 
                            '<tr>' +
                            '<td>' + m.id + '</td>' +
                            '<td>' + (m.titulo || '-') + '</td>' +
                            '<td>' + m.url + '</td>' +
                            '<td>' + m.imagem + '</td>' +
                            '<td><button class="del" onclick="remover(' + m.id + ')">Excluir</button></td>' +
                            '</tr>'
                        ).join('');
                    }
                    async function adicionar(e) {
                        e.preventDefault();
                        await fetch('/api/musicas', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                titulo: document.getElementById('titulo').value,
                                url: document.getElementById('url').value,
                                imagem: document.getElementById('imagem').value,
                                duracao: document.getElementById('duracao').value || '0:00'
                            })
                        });
                        e.target.reset();
                        carregar();
                    }
                    async function remover(id) {
                        await fetch('/api/musicas/' + id, { method: 'DELETE' });
                        carregar();
                    }
                    async function sincronizar() {
                        const res = await fetch('/api/musicas/sincronizar', { method: 'POST' });
                        const out = await res.json();
                        alert(out.adicionadas + ' nova(s) música(s) importada(s) da pasta!');
                        carregar();
                    }
                    carregar();
                </script>
            </body>
            </html>
        `);
    });

    api.listen(porta, '0.0.0.0', () => {
        console.log(`API e Banco rodando! Gerencie em: http://localhost:${porta}/admin`);
    });
}

module.exports = iniciarServidor;
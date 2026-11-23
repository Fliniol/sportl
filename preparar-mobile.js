const fs = require('fs');
const path = require('path');
const db = require('./database');

const wwwDir = path.join(__dirname, 'www');
if (!fs.existsSync(wwwDir)) fs.mkdirSync(wwwDir, { recursive: true });

// 1. Copia HTML, CSS e JS para a pasta mobile
['index.html', 'styles.css', 'script.js'].forEach(arquivo => {
    const origem = path.join(__dirname, arquivo);
    const destino = path.join(wwwDir, arquivo);
    if (fs.existsSync(origem)) fs.copyFileSync(origem, destino);
});

// 2. Empacota imagens e músicas dentro do aplicativo para tocar offline
['imagens', 'musicas'].forEach(pasta => {
    const pastaOrigem = path.join(__dirname, pasta);
    const pastaDestino = path.join(wwwDir, pasta);
    if (fs.existsSync(pastaOrigem)) {
        fs.cpSync(pastaOrigem, pastaDestino, { recursive: true });
        console.log(`Pasta ${pasta} empacotada para uso offline!`);
    }
});

// 3. Mantém permissão HTTP para sincronizar quando o PC estiver ligado
const manifestPath = path.join(__dirname, 'android', 'app', 'src', 'main', 'AndroidManifest.xml');
if (fs.existsSync(manifestPath)) {
    let xml = fs.readFileSync(manifestPath, 'utf8');
    if (!xml.includes('usesCleartextTraffic')) {
        xml = xml.replace('<application', '<application android:usesCleartextTraffic="true"');
        fs.writeFileSync(manifestPath, xml, 'utf8');
    }
}

// 4. Exporta todas as músicas cadastradas no SQLite para o pacote mobile
db.all("SELECT * FROM musicas ORDER BY id ASC", [], (err, rows) => {
    if (err) {
        console.error("Erro ao exportar o banco de dados:", err);
        process.exit(1);
    }
    fs.writeFileSync(
        path.join(wwwDir, 'playlist.json'),
        JSON.stringify(rows, null, 2),
        'utf8'
    );
    console.log(`Sucesso! ${rows.length} música(s) do banco gravada(s) no modo offline!`);
    process.exit(0);
});
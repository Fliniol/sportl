const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const dbPath = path.resolve(__dirname, 'spotiglke.db');

const musicasIniciais = [
    { titulo: "Big City Life", url: "musicas/Big City Life (feat. PAV4N).mp3", imagem: "imagens/4db211657da3062c85ec9306bdedacc8.png", duracao: "3:45" },
    { titulo: "telepatía - Kali Uchis", url: "musicas/Kali Uchis – telepatía [Official Music Video].mp3", imagem: "imagens/20220319_092314.jpg", duracao: "2:30" },
    { titulo: "Ela Só Pensa em Beijar", url: "musicas/Ela Só Pensa em Beijar (1965).mp3", imagem: "imagens/20230118_100321.jpg", duracao: "4:12" },
    { titulo: "Popotão Grandão", url: "musicas/Popotão Grandão (1982).mp3", imagem: "imagens/E6nUY90XoAMuRMB.jpg", duracao: "3:15" },
    { titulo: "Agora Tô Solteira", url: "musicas/Agora Tô Solteira (1985).mp3", imagem: "imagens/IMG_20191125_115415.jpg", duracao: "3:50" },
    { titulo: "ALL MY FELLAS", url: "musicas/ALL MY FELLAS.mp3", imagem: "imagens/IMG_20200707_210121.jpg", duracao: "3:01" },
    { titulo: "7 weeks & 3 days", url: "musicas/Yungatita - 7 weeks & 3 days (sped up).mp3", imagem: "imagens/IMG_20200717_171945.jpg", duracao: "3:14" },
    { titulo: "Big Poppa", url: "musicas/The Notorious B.I.G. - Big Poppa (Official Music Video).mp3", imagem: "imagens/IMG_20200718_002417.jpg", duracao: "3:45" },
    { titulo: "Street Football", url: "musicas/Street Football.mp3", imagem: "imagens/IMG_20200718_002423.jpg", duracao: "3:45" },
    { titulo: "Predador de Perereca", url: "musicas/Predador de Perereca (1982).mp3", imagem: "imagens/IMG_20200919_104532.jpg", duracao: "3:45" },
    { titulo: "Perdendo a Virgindade (MC VV)", url: "musicas/MC VV - PERDENDO A VIRGINDADE HEXALOGIA COMPLETA (I Á VI).mp3", imagem: "imagens/IMG_20200921_220303.jpg", duracao: "3:45" },
    { titulo: "It Was A Good Day", url: "musicas/Ice Cube - It Was A Good Day.mp3", imagem: "imagens/IMG_20201004_111119.jpg", duracao: "3:45" },
    { titulo: "Confess your love", url: "musicas/Jiandro - Confess your love (Audio) ft. ola.wav.mp3", imagem: "imagens/IMG_20201004_111122.jpg", duracao: "3:45" },
    { titulo: "Chess Type Beat", url: "musicas/Chess Type Beat ｜ joyful - chess (slowed).mp3", imagem: "imagens/IMG_20201009_152122.jpg", duracao: "3:45" },
    { titulo: "Justiça Incerta (Kizaru)", url: "musicas/Justiça Incerta (Kizaru).mp3", imagem: "imagens/IMG_20201011_130939.jpg", duracao: "3:45" }
];

let SQL = null;
let rawDb = null;
let ultimoMtime = 0;

function salvarNoDisco() {
    const dados = Buffer.from(rawDb.export());
    fs.writeFileSync(dbPath, dados);
    ultimoMtime = fs.statSync(dbPath).mtimeMs;
}

function recarregarSeMudouNoDisco() {
    if (fs.existsSync(dbPath)) {
        const mtimeAtual = fs.statSync(dbPath).mtimeMs;
        if (mtimeAtual > ultimoMtime) {
            if (rawDb) rawDb.close();
            rawDb = new SQL.Database(fs.readFileSync(dbPath));
            ultimoMtime = mtimeAtual;
        }
    }
}

const pronto = (async () => {
    SQL = await initSqlJs({
        locateFile: file => path.join(path.dirname(require.resolve('sql.js')), file)
    });

    if (fs.existsSync(dbPath)) {
        rawDb = new SQL.Database(fs.readFileSync(dbPath));
        ultimoMtime = fs.statSync(dbPath).mtimeMs;
    } else {
        rawDb = new SQL.Database();
    }

    rawDb.run(`
        CREATE TABLE IF NOT EXISTS musicas (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            titulo TEXT,
            url TEXT NOT NULL,
            imagem TEXT NOT NULL,
            duracao TEXT DEFAULT '0:00'
        )
    `);

    const check = rawDb.exec("SELECT COUNT(*) FROM musicas");
    const total = check[0]?.values?.[0]?.[0] || 0;

    if (total === 0) {
        rawDb.run("BEGIN TRANSACTION");
        for (const m of musicasIniciais) {
            rawDb.run(
                "INSERT INTO musicas (titulo, url, imagem, duracao) VALUES (?, ?, ?, ?)",
                [m.titulo, m.url, m.imagem, m.duracao]
            );
        }
        rawDb.run("COMMIT");
        salvarNoDisco();
        console.log("Banco SQLite (spotiglke.db) criado e populado com sucesso!");
    }
})();

const limparParams = (params) => (params || []).map(v => (v === undefined ? null : v));

const db = {
    all(sql, params, cb) {
        if (typeof params === 'function') { cb = params; params = []; }
        pronto.then(() => {
            try {
                recarregarSeMudouNoDisco();
                const stmt = rawDb.prepare(sql);
                stmt.bind(limparParams(params));
                const rows = [];
                while (stmt.step()) rows.push(stmt.getAsObject());
                stmt.free();
                if (cb) cb(null, rows);
            } catch (err) {
                if (cb) cb(err);
            }
        });
    },

    get(sql, params, cb) {
        this.all(sql, params, (err, rows) => {
            if (cb) cb(err, rows ? rows[0] : undefined);
        });
    },

    run(sql, params, cb) {
        if (typeof params === 'function') { cb = params; params = []; }
        pronto.then(() => {
            try {
                recarregarSeMudouNoDisco();
                rawDb.run(sql, limparParams(params));
                const changes = rawDb.getRowsModified();
                const resId = rawDb.exec("SELECT last_insert_rowid()");
                const lastID = resId[0]?.values?.[0]?.[0] || 0;
                salvarNoDisco();
                if (cb) cb.call({ lastID, changes }, null);
            } catch (err) {
                if (cb) cb(err);
            }
        });
    },

    prepare(sql) {
        const fila = [];
        return {
            run(...args) {
                const cb = typeof args[args.length - 1] === 'function' ? args.pop() : null;
                fila.push({ params: limparParams(args), cb });
            },
            finalize(cb) {
                pronto.then(() => {
                    try {
                        recarregarSeMudouNoDisco();
                        rawDb.run("BEGIN TRANSACTION");
                        for (const item of fila) {
                            rawDb.run(sql, item.params);
                            if (item.cb) item.cb(null);
                        }
                        rawDb.run("COMMIT");
                        salvarNoDisco();
                        if (cb) cb(null);
                    } catch (err) {
                        try { rawDb.run("ROLLBACK"); } catch (_) {}
                        if (cb) cb(err);
                    }
                });
            }
        };
    }
};

module.exports = db;
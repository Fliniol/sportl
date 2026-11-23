# Spotiglke

Reprodutor de áudio multiplataforma (Windows Desktop e Android) com arquitetura cliente-servidor, API RESTful em Node.js e Express, persistência de dados em SQLite (`sql.js`), painel administrativo web e suporte híbrido para reprodução online e offline.

## Visão Geral

O **Spotiglke** foi projetado para centralizar uma biblioteca pessoal de músicas em um banco de dados local e distribuí-la tanto em um player flutuante para computador quanto em um aplicativo mobile para Android, mantendo a mesma base de interface responsiva.

### Principais Funcionalidades

* **Player Desktop (Electron):** Janela sem bordas (`frameless`) e transparente com controles personalizados de reprodução, barra de progresso interativa, controle de volume, modo aleatório (shuffle) e arraste de janela.
* **Aplicativo Android (Capacitor):** Empacotamento nativo para Android (`.apk`) com adaptação automática de layout para tela cheia (`modo-celular`).
* **Arquitetura Híbrida (Online e Offline):**
  * **Modo Online (Rede Local):** Sincroniza em tempo real com o servidor Node.js via Wi-Fi para streaming de áudio e atualização dinâmica da playlist.
  * **Modo Offline:** O script `preparar-mobile.js` exporta os registros do banco SQLite para `playlist.json` e empacota os arquivos MP3 e capas dentro do APK, garantindo funcionamento completo mesmo com o computador desligado, com fallback automático caso a conexão caia.
* **API REST & Painel Administrativo (`/admin`):** Endpoints para listar, cadastrar, editar e remover músicas, além de sincronização automática de arquivos locais e automação de ingestão de áudio.
* **Banco de Dados SQLite (`sql.js`):** Persistência relacional leve em WebAssembly, eliminando dependências de compilação nativa no Windows.

## Tecnologias Utilizadas

* **Back-end e API:** Node.js, Express, CORS
* **Banco de Dados:** SQLite via `sql.js`
* **Desktop:** Electron
* **Mobile:** Capacitor (Android / Gradle)
* **Front-end:** HTML5, CSS3, JavaScript (ES6+)

## Estrutura do Projeto

```
spotiglke/
├── android/               # Projeto nativo Android gerado pelo Capacitor
├── imagens/               # Capas dos álbuns e ícones da interface
├── musicas/               # Arquivos de áudio (.mp3)
├── www/                   # Build web empacotada para o aplicativo mobile
├── database.js            # Configuração e persistência do banco SQLite (sql.js)
├── server.js              # Servidor Express, API REST e rotas do painel admin
├── main.js                # Processo principal da janela Electron (Desktop)
├── preparar-mobile.js     # Script de build offline (copia mídias e exporta SQLite para JSON)
├── capacitor.config.json  # Configurações do Capacitor e liberação de tráfego HTTP
├── index.html             # Interface principal do reprodutor
├── styles.css             # Estilização Desktop e responsividade Mobile
├── script.js              # Lógica do player, consumo da API e fallback offline
└── package.json           # Dependências e scripts de execução
```

## Como Executar

### 1. Pré-requisitos

* Node.js (v18 ou superior)
* Android Studio (apenas caso deseje compilar o arquivo `.apk` para Android)

### 2. Instalação

1. Clone o repositório:

```
git clone https://github.com/Fliniol/Spotiglke.git
```

2. Acesse a pasta do projeto e instale as dependências:

```
cd Spotiglke
npm install
```

### 3. Executando no Computador (Desktop + Servidor)

Inicie a aplicação Electron junto com a API local:

```
npm start
```

* O player desktop será aberto automaticamente.
* O painel administrativo web ficará acessível em `http://localhost:3000/admin`.

### 4. Gerando a Versão Android (APK Híbrido/Offline)

1. No arquivo `script.js`, ajuste a constante `IP_DO_SEU_PC` com o endereço IPv4 local da sua máquina caso queira sincronizar via Wi-Fi quando o servidor estiver ativo.
2. Execute o script de empacotamento offline e sincronize com o Capacitor:

```
node preparar-mobile.js
npx cap sync
```

3. Abra o projeto no Android Studio para gerar o instalador:

```
npx cap open android
```

4. No Android Studio, acesse **Build > Generate App Bundles or APKs > Generate APKs**.

## Autor

**Christopher Feitosa do Monte**

* GitHub: [@Fliniol](https://github.com/Fliniol)
* LinkedIn: [Christopher Feitosa](https://www.linkedin.com/in/christopher-feitosa-8502a638b/)
// public/script.js (VERSI PERBAIKAN V5 - LOGIKA JOIN LEBIH BAIK)

// Arahkan ke servermu (kalau di-hosting ganti ini, kalau lokal biarin kosong)
// const socket = io("https://tarik-tambang.onrender.com"); 
const socket = io(); 

// --- Ambil Elemen Layar ---
const messagesDiv = document.getElementById('messages');
const lobbyScreen = document.getElementById('lobbyScreen');
const waitingScreen = document.getElementById('waitingScreen');
const gameArea = document.getElementById('gameArea');

// --- Elemen Lobby ---
const nameInput = document.getElementById('nameInput');
const createLobbyBtn = document.getElementById('createLobbyBtn');
const joinLobbyBtn = document.getElementById('joinLobbyBtn');
const lobbyCodeInput = document.getElementById('lobbyCodeInput');
const lobbyCodeDisplay = document.getElementById('lobbyCodeDisplay');
const waitCodeDisplay = document.getElementById('waitCode');

// --- Elemen Game ---
const questionDiv = document.getElementById('question');
const answerInput = document.getElementById('answerInput');
const submitBtn = document.getElementById('submitBtn');
const ropeDiv = document.getElementById('rope');
const player1ScoreDiv = document.getElementById('player1Score');
const player2ScoreDiv = document.getElementById('player2Score');

let playerInfo = null; // Menyimpan info pemain ini

// --- Fungsi Helper ---
function displayMessage(message, type = 'success') {
    messagesDiv.textContent = message;
    if (type === 'error') { messagesDiv.style.color = 'var(--color-red)'; }
    else if (type === 'success') { messagesDiv.style.color = 'var(--color-green)'; }
    else { messagesDiv.style.color = 'var(--color-text-dim)'; }
}

function showScreen(screenName) {
    lobbyScreen.classList.add('hidden');
    waitingScreen.classList.add('hidden');
    gameArea.classList.add('hidden');
    
    if (screenName === 'lobby') lobbyScreen.classList.remove('hidden');
    if (screenName === 'waiting') waitingScreen.classList.remove('hidden');
    if (screenName === 'game') gameArea.classList.remove('hidden');
}

function updateScoreboard(players) {
    if (!players) return;
    let p1Name = "Tim Merah"; let p1Score = 0;
    let p2Name = "Tim Biru"; let p2Score = 0;

    for (const id in players) {
        const player = players[id];
        if (player.team === 'red') { p1Name = player.name; p1Score = player.score; }
        else { p2Name = player.name; p2Score = player.score; }
    }
    player1ScoreDiv.textContent = `${p1Name}: ${p1Score}`;
    player2ScoreDiv.textContent = `${p2Name}: ${p2Score}`;
}


// --- Event Tombol Lobby ---
createLobbyBtn.addEventListener('click', () => {
    const name = nameInput.value.trim();
    if (!name) { displayMessage("Masukkan namamu dulu!", 'error'); return; }
    socket.emit('createLobby', name);
});

joinLobbyBtn.addEventListener('click', () => {
    const name = nameInput.value.trim();
    const code = lobbyCodeInput.value.trim();
    if (!name || !code) { displayMessage("Masukkan nama DAN kode lobby!", 'error'); return; }
    socket.emit('joinLobby', { name, code });
});

// --- Socket.IO Events (Logika Baru) ---
socket.on('connect', () => {
    displayMessage("Terhubung. Silakan gabung atau buat lobby.", 'success');
    showScreen('lobby'); // Pastikan selalu mulai dari lobby
});

socket.on('error', (message) => {
    displayMessage(message, 'error');
    showScreen('lobby'); // Kembalikan ke lobby jika error
});

// Hanya untuk P1 (Pembuat Lobby)
socket.on('lobbyCreated', (roomCode, players) => {
    displayMessage(`Lobby dibuat! Kode: ${roomCode}. Tunggu temanmu...`, 'success');
    waitCodeDisplay.textContent = roomCode; // Tampilkan kode di layar tunggu
    showScreen('waiting');
    updateScoreboard(players);
});

// Hanya untuk P2 (Penantang)
socket.on('joinSuccess', (roomCode) => {
    displayMessage("Berhasil gabung lobby! Menunggu game mulai...", 'success');
    waitCodeDisplay.textContent = roomCode; // Tampilkan kode yg dijoin
    showScreen('waiting'); // <<< INI YANG PENTING: P2 PINDAH LAYAR
});

// Untuk P1 dan P2 (Update nama/skor)
socket.on('lobbyUpdate', (players) => {
    updateScoreboard(players);
});

// Disimpan di P1 dan P2
socket.on('playerInfo', (info) => {
    playerInfo = info; // Simpan info kita (tim, nama)
});


// (Sisa event game sama persis)
socket.on('message', (msg) => { displayMessage(msg, 'info'); });

socket.on('gameStarted', () => {
    displayMessage("Game dimulai! Jawab pertanyaan secepatnya!");
    showScreen('game');
    answerInput.disabled = false;
    submitBtn.disabled = false;
    answerInput.focus();
});

socket.on('newQuestion', (question) => {
    questionDiv.textContent = question;
    answerInput.value = '';
    answerInput.disabled = false;
    submitBtn.disabled = false;
    answerInput.focus();
});

socket.on('tugUpdate', (position) => {
    const maxTug = 50; const ropeWidth = 50;
    const percentage = ((position + maxTug) / (maxTug * 2)) * 100;
    ropeDiv.style.left = `${percentage - (ropeWidth / 2)}%`; 
});

socket.on('scoreUpdate', (players) => {
    updateScoreboard(players);
});

socket.on('gameOver', (message) => {
    displayMessage(message, 'success');
    answerInput.disabled = true;
    submitBtn.disabled = true;
    setTimeout(() => {
        alert(message + "\nGame akan direset. Kembali ke lobby.");
        window.location.reload();
    }, 2000);
});

socket.on('gameReset', () => {
    displayMessage("Game direset. Kembali ke lobby.", 'info');
    showScreen('lobby');
    lobbyCodeInput.value = "";
    updateScoreboard(null);
    ropeDiv.style.left = '25%';
});

// --- Event Tombol Game ---
submitBtn.addEventListener('click', () => {
    const answer = answerInput.value;
    if (answer !== '') {
        socket.emit('submitAnswer', answer);
        answerInput.disabled = true;
        submitBtn.disabled = true;
    }
});
answerInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter' && !submitBtn.disabled) {
        submitBtn.click();
    }
});
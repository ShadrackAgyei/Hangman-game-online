class HangmanGame {
    constructor() {
        // Connect to backend server using config
        this.socket = io(window.HANGMAN_CONFIG.BACKEND_URL);
        this.currentRoom = null;
        this.currentUser = null;
        this.isPlayer = false;
        this.isModerator = false;
        this.gameState = null;
        this.wrongGuessCount = 0;
        this.maxWrongGuesses = 6;
        
        this.initializeEventListeners();
        this.initializeSocketListeners();
        this.createAlphabet();
    }

    initializeEventListeners() {
        // Navigation buttons
        document.getElementById('create-lobby-btn').addEventListener('click', () => this.showScreen('create-lobby'));
        document.getElementById('join-lobby-btn').addEventListener('click', () => this.showScreen('join-lobby'));
        document.getElementById('back-to-menu').addEventListener('click', () => this.showScreen('main-menu'));
        document.getElementById('back-to-menu-join').addEventListener('click', () => this.showScreen('main-menu'));

        // Form submissions
        document.getElementById('create-lobby-form').addEventListener('submit', (e) => this.handleCreateLobby(e));
        document.getElementById('join-lobby-form').addEventListener('submit', (e) => this.handleJoinLobby(e));

        // Lobby actions
        document.getElementById('submit-words').addEventListener('click', () => this.submitWords());
        document.getElementById('start-game').addEventListener('click', () => this.startGame());
        document.getElementById('leave-lobby').addEventListener('click', () => this.leaveLobby());

        // Game actions
        document.getElementById('submit-guess').addEventListener('click', () => this.submitGuess());
        document.getElementById('letter-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.submitGuess();
        });

        // End game actions
        document.getElementById('new-game').addEventListener('click', () => this.showScreen('main-menu'));
        document.getElementById('back-to-main').addEventListener('click', () => this.showScreen('main-menu'));

        // Room code input formatting
        document.getElementById('room-code').addEventListener('input', (e) => {
            e.target.value = e.target.value.toUpperCase();
        });
    }

    initializeSocketListeners() {
        this.socket.on('lobby-created', (data) => this.handleLobbyCreated(data));
        this.socket.on('lobby-joined', (data) => this.handleLobbyJoined(data));
        this.socket.on('player-joined', (data) => this.handlePlayerJoined(data));
        this.socket.on('words-submitted', (data) => this.handleWordsSubmitted(data));
        this.socket.on('game-started', (data) => this.handleGameStarted(data));
        this.socket.on('guess-made', (data) => this.handleGuessMade(data));
        this.socket.on('word-solved', (data) => this.handleWordSolved(data));
        this.socket.on('next-word', (data) => this.handleNextWord(data));
        this.socket.on('game-ended', (data) => this.handleGameEnded(data));
        this.socket.on('time-update', (data) => this.handleTimeUpdate(data));
        this.socket.on('turn-skipped', (data) => this.handleTurnSkipped(data));
        this.socket.on('player-disconnected', (data) => this.handlePlayerDisconnected(data));
        this.socket.on('moderator-disconnected', () => this.handleModeratorDisconnected());
        this.socket.on('error', (data) => this.showNotification(data.message, 'error'));
    }

    showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(screen => screen.classList.remove('active'));
        document.getElementById(screenId).classList.add('active');
    }

    showNotification(message, type = 'info') {
        const notification = document.getElementById('notifications');
        notification.textContent = message;
        notification.style.display = 'block';
        notification.className = `notifications ${type}`;
        
        setTimeout(() => {
            notification.style.display = 'none';
        }, 3000);
    }

    handleCreateLobby(e) {
        e.preventDefault();
        const username = document.getElementById('moderator-name').value.trim();
        const maxPlayers = parseInt(document.getElementById('max-players').value);
        const wordsPerGame = parseInt(document.getElementById('words-per-game').value);

        if (!username) {
            this.showNotification('Please enter your name', 'error');
            return;
        }

        this.currentUser = username;
        this.isModerator = true;
        this.isPlayer = false;

        this.socket.emit('create-lobby', {
            username,
            maxPlayers,
            wordsPerGame
        });

        this.showLoading(true);
    }

    handleJoinLobby(e) {
        e.preventDefault();
        const username = document.getElementById('player-name').value.trim();
        const roomId = document.getElementById('room-code').value.trim();

        if (!username || !roomId) {
            this.showNotification('Please enter both name and room code', 'error');
            return;
        }

        this.currentUser = username;
        this.isPlayer = true;
        this.isModerator = false;

        this.socket.emit('join-lobby', {
            username,
            roomId
        });

        this.showLoading(true);
    }

    handleLobbyCreated(data) {
        this.showLoading(false);
        this.currentRoom = data.roomId;
        this.updateLobbyDisplay(data);
        this.showScreen('lobby');
        this.showNotification(`Lobby created! Room code: ${data.roomId}`, 'success');
    }

    handleLobbyJoined(data) {
        this.showLoading(false);
        this.currentRoom = data.roomId;
        this.updateLobbyDisplay(data);
        this.showScreen('lobby');
        this.showNotification(`Joined lobby: ${data.roomId}`, 'success');
    }

    handlePlayerJoined(data) {
        this.updatePlayersList(data.players);
        this.showNotification(`${data.newPlayer} joined the game`, 'info');
    }

    updateLobbyDisplay(data) {
        document.getElementById('lobby-room-code').textContent = data.roomId;
        document.getElementById('current-players').textContent = data.players.length;
        document.getElementById('max-players-display').textContent = data.maxPlayers;
        document.getElementById('words-per-game-display').textContent = data.wordsPerGame;
        document.getElementById('moderator-display').textContent = data.moderator;
        
        this.updatePlayersList(data.players);
        
        if (this.isModerator) {
            document.getElementById('moderator-controls').style.display = 'block';
        }
    }

    updatePlayersList(players) {
        const playersList = document.getElementById('players-list');
        playersList.innerHTML = '';
        
        players.forEach(player => {
            const playerDiv = document.createElement('div');
            playerDiv.className = 'player-item';
            playerDiv.innerHTML = `
                <span>${player.username}</span>
                <span class="player-status">${player.connected ? 'Connected' : 'Disconnected'}</span>
            `;
            playersList.appendChild(playerDiv);
        });
    }

    submitWords() {
        const category = document.getElementById('word-category').value;
        const wordList = document.getElementById('word-list').value.trim();
        
        if (!wordList) {
            this.showNotification('Please enter some words', 'error');
            return;
        }

        const words = wordList.split('\n').map(word => word.trim()).filter(word => word.length > 0);
        
        if (words.length === 0) {
            this.showNotification('Please enter valid words', 'error');
            return;
        }

        this.socket.emit('submit-words', {
            roomId: this.currentRoom,
            words,
            category
        });
    }

    handleWordsSubmitted(data) {
        this.showNotification(`${data.wordCount} words submitted for ${data.category}`, 'success');
        document.getElementById('start-game').disabled = false;
    }

    startGame() {
        this.socket.emit('start-game', {
            roomId: this.currentRoom
        });
    }

    handleGameStarted(data) {
        this.gameState = data;
        this.wrongGuessCount = 0;
        this.updateGameDisplay(data);
        this.showScreen('game');
        this.showNotification('Game started!', 'success');
        this.resetHangman();
    }

    updateGameDisplay(data) {
        document.getElementById('current-category').textContent = data.category;
        document.getElementById('current-word-num').textContent = data.wordNumber;
        document.getElementById('total-words').textContent = data.totalWords;
        document.getElementById('current-player-name').textContent = data.currentPlayer;
        document.getElementById('timer').textContent = data.timeLeft || 30;
        
        this.updateWordDisplay(data.currentWord);
        this.updateScoreboard(data.players);
        this.updateGuessedLetters(data.guessedLetters || []);
        this.updateAlphabet(data.guessedLetters || []);
    }

    updateWordDisplay(word) {
        const wordLetters = document.getElementById('word-letters');
        wordLetters.innerHTML = '';
        
        word.forEach(letter => {
            const span = document.createElement('span');
            span.className = 'word-letter';
            span.textContent = letter === '_' ? '_' : letter;
            span.style.margin = '0 5px';
            span.style.borderBottom = '2px solid #333';
            span.style.minWidth = '20px';
            span.style.textAlign = 'center';
            wordLetters.appendChild(span);
        });
    }

    updateScoreboard(players) {
        const scoreboard = document.getElementById('players-scores');
        scoreboard.innerHTML = '';
        
        // Sort players by score (highest first)
        const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
        
        sortedPlayers.forEach((player, index) => {
            const playerDiv = document.createElement('div');
            playerDiv.className = 'player-score';
            playerDiv.innerHTML = `
                <span class="rank">${index + 1}.</span>
                <span class="name">${player.username}</span>
                <span class="score">${player.score}</span>
            `;
            
            if (player.username === this.currentUser) {
                playerDiv.style.fontWeight = 'bold';
                playerDiv.style.backgroundColor = '#e3f2fd';
            }
            
            scoreboard.appendChild(playerDiv);
        });
    }

    updateGuessedLetters(guessedLetters) {
        document.getElementById('guessed-letters-display').textContent = guessedLetters.join(', ').toUpperCase();
    }

    createAlphabet() {
        const alphabet = document.getElementById('alphabet');
        const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        
        for (let letter of letters) {
            const button = document.createElement('button');
            button.textContent = letter;
            button.className = 'alphabet-btn';
            button.addEventListener('click', () => this.makeGuess(letter.toLowerCase()));
            alphabet.appendChild(button);
        }
    }

    updateAlphabet(guessedLetters) {
        const buttons = document.querySelectorAll('.alphabet-btn');
        buttons.forEach(button => {
            const letter = button.textContent.toLowerCase();
            if (guessedLetters.includes(letter)) {
                button.disabled = true;
                button.classList.add('disabled');
            } else {
                button.disabled = false;
                button.classList.remove('disabled');
            }
        });
    }

    makeGuess(letter) {
        if (this.gameState && this.gameState.currentPlayer === this.currentUser) {
            this.socket.emit('make-guess', {
                roomId: this.currentRoom,
                letter: letter.toLowerCase()
            });
        } else {
            this.showNotification('Not your turn!', 'error');
        }
    }

    submitGuess() {
        const letterInput = document.getElementById('letter-input');
        const letter = letterInput.value.toLowerCase();
        
        if (!letter || letter.length !== 1) {
            this.showNotification('Please enter a single letter', 'error');
            return;
        }

        this.makeGuess(letter);
        letterInput.value = '';
    }

    handleGuessMade(data) {
        this.updateGameDisplay({
            currentWord: data.currentWord,
            currentPlayer: data.currentPlayer,
            players: data.players,
            guessedLetters: data.guessedLetters,
            category: this.gameState.category,
            wordNumber: this.gameState.wordNumber,
            totalWords: this.gameState.totalWords
        });

        const message = data.correct ? 
            `${data.player} guessed '${data.letter.toUpperCase()}' correctly! (+${data.scoreChange})` :
            `${data.player} guessed '${data.letter.toUpperCase()}' incorrectly! (${data.scoreChange})`;
        
        this.showNotification(message, data.correct ? 'success' : 'error');
        
        if (!data.correct) {
            this.wrongGuessCount++;
            this.updateHangman();
        }
    }

    handleWordSolved(data) {
        this.showNotification(`🎉 ${data.solver} solved the word: ${data.word.toUpperCase()}!`, 'success');
        this.updateScoreboard(data.players);
    }

    handleNextWord(data) {
        this.gameState = data;
        this.wrongGuessCount = 0;
        this.updateGameDisplay(data);
        this.resetHangman();
        this.showNotification('Next word!', 'info');
    }

    handleGameEnded(data) {
        document.getElementById('winner-name').textContent = data.winner.username;
        document.getElementById('winner-score').textContent = data.winner.score;
        
        const finalScoreboard = document.getElementById('final-scoreboard');
        finalScoreboard.innerHTML = '';
        
        data.finalScores.forEach((player, index) => {
            const playerDiv = document.createElement('div');
            playerDiv.className = 'final-player-score';
            playerDiv.innerHTML = `
                <span class="rank">${index + 1}.</span>
                <span class="name">${player.username}</span>
                <span class="score">${player.score}</span>
            `;
            finalScoreboard.appendChild(playerDiv);
        });
        
        this.showScreen('game-end');
        this.showNotification('Game ended!', 'info');
    }

    handleTimeUpdate(data) {
        document.getElementById('timer').textContent = data.timeLeft;
        
        // Change color based on time remaining
        const timer = document.getElementById('timer');
        if (data.timeLeft <= 10) {
            timer.style.color = '#ef5350';
        } else if (data.timeLeft <= 20) {
            timer.style.color = '#ff9800';
        } else {
            timer.style.color = '#42a5f5';
        }
    }

    handleTurnSkipped(data) {
        this.updateGameDisplay({
            currentPlayer: data.currentPlayer,
            players: data.players,
            currentWord: this.gameState.currentWord,
            guessedLetters: this.gameState.guessedLetters,
            category: this.gameState.category,
            wordNumber: this.gameState.wordNumber,
            totalWords: this.gameState.totalWords
        });
        
        this.showNotification('Turn skipped - time ran out!', 'info');
    }

    handlePlayerDisconnected(data) {
        this.showNotification(`${data.player} disconnected`, 'info');
        
        if (data.currentPlayer) {
            this.updateGameDisplay({
                currentPlayer: data.currentPlayer,
                players: data.players,
                currentWord: this.gameState.currentWord,
                guessedLetters: this.gameState.guessedLetters,
                category: this.gameState.category,
                wordNumber: this.gameState.wordNumber,
                totalWords: this.gameState.totalWords
            });
        } else {
            this.updatePlayersList(data.players);
        }
    }

    handleModeratorDisconnected() {
        this.showNotification('Moderator disconnected. Game ended.', 'error');
        this.showScreen('main-menu');
    }

    resetHangman() {
        const hangmanParts = ['head', 'body', 'left-arm', 'right-arm', 'left-leg', 'right-leg'];
        hangmanParts.forEach(part => {
            document.getElementById(part).style.display = 'none';
        });
    }

    updateHangman() {
        const hangmanParts = ['head', 'body', 'left-arm', 'right-arm', 'left-leg', 'right-leg'];
        if (this.wrongGuessCount <= hangmanParts.length) {
            document.getElementById(hangmanParts[this.wrongGuessCount - 1]).style.display = 'block';
        }
    }

    leaveLobby() {
        this.currentRoom = null;
        this.currentUser = null;
        this.isPlayer = false;
        this.isModerator = false;
        this.gameState = null;
        this.showScreen('main-menu');
        this.showNotification('Left lobby', 'info');
    }

    showLoading(show) {
        document.getElementById('loading').style.display = show ? 'flex' : 'none';
    }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new HangmanGame();
});

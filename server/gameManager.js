class GameManager {
    constructor() {
        this.lobbies = new Map();
        this.playerToRoom = new Map();
        this.timers = new Map();
        
        // Predefined word categories
        this.wordCategories = {
            'Animals': ['elephant', 'giraffe', 'penguin', 'butterfly', 'kangaroo', 'dolphin', 'cheetah', 'octopus'],
            'Countries': ['france', 'australia', 'brazil', 'japan', 'canada', 'egypt', 'india', 'norway'],
            'Movies': ['avatar', 'titanic', 'inception', 'matrix', 'gladiator', 'frozen', 'jaws', 'rocky'],
            'Sports': ['basketball', 'football', 'tennis', 'swimming', 'hockey', 'golf', 'baseball', 'volleyball'],
            'Food': ['pizza', 'chocolate', 'hamburger', 'spaghetti', 'sandwich', 'pancake', 'cookie', 'banana'],
            'Technology': ['computer', 'smartphone', 'internet', 'software', 'database', 'javascript', 'python', 'robot']
        };
    }

    createLobby(roomId, socketId, username, maxPlayers = 6, wordsPerGame = 5) {
        if (this.lobbies.has(roomId)) {
            return { success: false, message: 'Room already exists' };
        }

        const lobby = {
            id: roomId,
            moderator: username,
            moderatorId: socketId,
            players: [],
            maxPlayers,
            wordsPerGame,
            words: [],
            gameState: null,
            status: 'waiting' // waiting, playing, ended
        };

        this.lobbies.set(roomId, lobby);
        this.playerToRoom.set(socketId, roomId);
        
        return { success: true, lobby };
    }

    joinLobby(roomId, socketId, username) {
        const lobby = this.lobbies.get(roomId);
        
        if (!lobby) {
            return { success: false, message: 'Room not found' };
        }

        if (lobby.status !== 'waiting') {
            return { success: false, message: 'Game already in progress' };
        }

        if (lobby.players.length >= lobby.maxPlayers) {
            return { success: false, message: 'Room is full' };
        }

        // Check if username already exists
        if (lobby.players.some(p => p.username === username)) {
            return { success: false, message: 'Username already taken in this room' };
        }

        const player = {
            id: socketId,
            username,
            score: 10,
            connected: true
        };

        lobby.players.push(player);
        this.playerToRoom.set(socketId, roomId);

        return { success: true, lobby };
    }

    submitWords(roomId, socketId, words, category) {
        const lobby = this.lobbies.get(roomId);
        
        if (!lobby) {
            return { success: false, message: 'Room not found' };
        }

        if (lobby.moderatorId !== socketId) {
            return { success: false, message: 'Only moderator can submit words' };
        }

        // Process words - clean and validate
        const processedWords = words.map(word => ({
            word: word.toLowerCase().trim(),
            category: category || 'Custom'
        }));

        lobby.words = processedWords;
        
        return { success: true };
    }

    startGame(roomId, socketId) {
        const lobby = this.lobbies.get(roomId);
        
        if (!lobby) {
            return { success: false, message: 'Room not found' };
        }

        if (lobby.moderatorId !== socketId) {
            return { success: false, message: 'Only moderator can start game' };
        }

        if (lobby.players.length < 2) {
            return { success: false, message: 'Need at least 2 players to start' };
        }

        if (lobby.words.length === 0) {
            return { success: false, message: 'No words submitted' };
        }

        // Reset player scores
        lobby.players.forEach(player => {
            player.score = 10;
        });

        // Shuffle words
        const shuffledWords = this.shuffleArray([...lobby.words]);

        // Initialize game state
        lobby.gameState = {
            currentWordIndex: 0,
            totalWords: Math.min(lobby.wordsPerGame, shuffledWords.length),
            words: shuffledWords,
            currentWord: shuffledWords[0],
            displayWord: shuffledWords[0].word.split('').map(() => '_'),
            guessedLetters: [],
            currentPlayerIndex: 0,
            players: [...lobby.players],
            status: 'active',
            turnStartTime: Date.now()
        };

        // Start with first active player
        const activePlayers = lobby.gameState.players.filter(p => p.connected);
        lobby.gameState.currentPlayer = activePlayers[0].username;
        lobby.status = 'playing';

        return { success: true, gameState: lobby.gameState };
    }

    makeGuess(roomId, socketId, letter) {
        const lobby = this.lobbies.get(roomId);
        
        if (!lobby || !lobby.gameState) {
            return { success: false, message: 'Game not found' };
        }

        const gameState = lobby.gameState;
        const player = gameState.players.find(p => p.id === socketId);
        
        if (!player) {
            return { success: false, message: 'Player not found' };
        }

        if (gameState.currentPlayer !== player.username) {
            return { success: false, message: 'Not your turn' };
        }

        if (gameState.status !== 'active') {
            return { success: false, message: 'Game not active' };
        }

        letter = letter.toLowerCase();

        // Check if letter already guessed
        if (gameState.guessedLetters.includes(letter)) {
            return { success: false, message: 'Letter already guessed' };
        }

        gameState.guessedLetters.push(letter);
        
        const word = gameState.currentWord.word;
        const isCorrect = word.includes(letter);
        let scoreChange = 0;
        let wordSolved = false;

        if (isCorrect) {
            // Update display word
            for (let i = 0; i < word.length; i++) {
                if (word[i] === letter) {
                    gameState.displayWord[i] = letter;
                }
            }
            
            // Award points for correct guess
            player.score += 1;
            scoreChange = 1;
            
            // Check if word is solved
            if (!gameState.displayWord.includes('_')) {
                player.score += 1; // Bonus for solving word
                scoreChange = 2;
                wordSolved = true;
                gameState.status = 'word_solved';
            }
        } else {
            // Deduct points for incorrect guess
            player.score = Math.max(0, player.score - 1);
            scoreChange = -1;
        }

        // Move to next player
        this.moveToNextPlayer(gameState);

        return { 
            success: true, 
            gameState,
            player: player.username,
            correct: isCorrect,
            scoreChange,
            wordSolved
        };
    }

    moveToNextPlayer(gameState) {
        const activePlayers = gameState.players.filter(p => p.connected);
        
        if (activePlayers.length === 0) {
            gameState.status = 'ended';
            return;
        }

        // Find current player's index in the active players array
        const currentActiveIndex = activePlayers.findIndex(p => p.username === gameState.currentPlayer);
        
        // Move to next player in active players array
        const nextActiveIndex = (currentActiveIndex + 1) % activePlayers.length;
        const nextPlayer = activePlayers[nextActiveIndex];
        
        // Update game state
        gameState.currentPlayerIndex = nextActiveIndex;
        gameState.currentPlayer = nextPlayer.username;
        gameState.turnStartTime = Date.now();
    }

    nextWord(roomId) {
        const lobby = this.lobbies.get(roomId);
        
        if (!lobby || !lobby.gameState) {
            return { success: false, message: 'Game not found' };
        }

        const gameState = lobby.gameState;
        
        // Check if there are more words
        if (gameState.currentWordIndex + 1 >= gameState.totalWords) {
            // Game ended
            const finalScores = gameState.players
                .sort((a, b) => b.score - a.score)
                .map(p => ({ username: p.username, score: p.score }));
            
            const winner = finalScores[0];
            gameState.status = 'ended';
            lobby.status = 'ended';
            
            return { 
                success: true, 
                gameEnded: true, 
                finalScores,
                winner
            };
        }

        // Move to next word
        gameState.currentWordIndex++;
        gameState.currentWord = gameState.words[gameState.currentWordIndex];
        gameState.displayWord = gameState.currentWord.word.split('').map(() => '_');
        gameState.guessedLetters = [];
        gameState.status = 'active';
        
        // Start with first active player
        const activePlayers = gameState.players.filter(p => p.connected);
        gameState.currentPlayerIndex = 0;
        gameState.currentPlayer = activePlayers[0].username;
        gameState.turnStartTime = Date.now();

        return { success: true, gameState };
    }

    startTurnTimer(roomId, io) {
        // Clear existing timer
        if (this.timers.has(roomId)) {
            clearInterval(this.timers.get(roomId));
        }

        const lobby = this.lobbies.get(roomId);
        if (!lobby || !lobby.gameState || lobby.gameState.status !== 'active') {
            return;
        }

        let timeLeft = 30;
        
        const timer = setInterval(() => {
            timeLeft--;
            
            // Emit time update
            io.to(roomId).emit('time-update', { timeLeft });
            
            if (timeLeft <= 0) {
                clearInterval(timer);
                this.timers.delete(roomId);
                
                // Skip turn
                this.moveToNextPlayer(lobby.gameState);
                
                io.to(roomId).emit('turn-skipped', {
                    currentPlayer: lobby.gameState.currentPlayer,
                    players: lobby.gameState.players,
                    timeLeft: 30
                });
                
                // Start next turn timer
                this.startTurnTimer(roomId, io);
            }
        }, 1000);

        this.timers.set(roomId, timer);
    }

    handleDisconnection(socketId, io) {
        const roomId = this.playerToRoom.get(socketId);
        
        if (!roomId) return;

        const lobby = this.lobbies.get(roomId);
        if (!lobby) return;

        // If moderator disconnects, end the game
        if (lobby.moderatorId === socketId) {
            io.to(roomId).emit('moderator-disconnected');
            this.cleanupLobby(roomId);
            return;
        }

        // Mark player as disconnected
        const player = lobby.players.find(p => p.id === socketId);
        if (player) {
            player.connected = false;
            
            // If game is active and it's disconnected player's turn, skip
            if (lobby.gameState && lobby.gameState.status === 'active' && 
                lobby.gameState.currentPlayer === player.username) {
                this.moveToNextPlayer(lobby.gameState);
                io.to(roomId).emit('player-disconnected', {
                    player: player.username,
                    currentPlayer: lobby.gameState.currentPlayer,
                    players: lobby.gameState.players
                });
            } else {
                io.to(roomId).emit('player-disconnected', {
                    player: player.username,
                    players: lobby.players
                });
            }
        }

        this.playerToRoom.delete(socketId);
    }

    cleanupLobby(roomId) {
        const lobby = this.lobbies.get(roomId);
        if (lobby) {
            // Clear timers
            if (this.timers.has(roomId)) {
                clearInterval(this.timers.get(roomId));
                this.timers.delete(roomId);
            }
            
            // Remove player mappings
            lobby.players.forEach(player => {
                this.playerToRoom.delete(player.id);
            });
            
            // Remove lobby
            this.lobbies.delete(roomId);
        }
    }

    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    getWordsByCategory(category) {
        return this.wordCategories[category] || [];
    }

    getAllCategories() {
        return Object.keys(this.wordCategories);
    }
}

module.exports = GameManager;

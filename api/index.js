const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const { v4: uuidv4 } = require('uuid');
const GameManager = require('./gameManager');
const cors = require('cors');

const app = express();

// Enable CORS for all routes
app.use(cors());

// Create HTTP server
const server = createServer(app);

// Initialize Socket.io with CORS
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
        credentials: true
    },
    transports: ['websocket', 'polling']
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// API endpoint to get server info
app.get('/api/info', (req, res) => {
    res.json({
        name: 'Multiplayer Hangman Backend',
        version: '1.0.0',
        status: 'running'
    });
});

// Game manager instance
const gameManager = new GameManager();

// Socket.io connection handling
io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Create lobby
    socket.on('create-lobby', (data) => {
        const { username, maxPlayers, wordsPerGame } = data;
        const roomId = uuidv4().substring(0, 8).toUpperCase();
        
        const result = gameManager.createLobby(roomId, socket.id, username, maxPlayers, wordsPerGame);
        
        if (result.success) {
            socket.join(roomId);
            socket.emit('lobby-created', {
                roomId,
                moderator: username,
                players: result.lobby.players,
                maxPlayers,
                wordsPerGame
            });
        } else {
            socket.emit('error', { message: result.message });
        }
    });

    // Join lobby
    socket.on('join-lobby', (data) => {
        const { roomId, username } = data;
        
        const result = gameManager.joinLobby(roomId, socket.id, username);
        
        if (result.success) {
            socket.join(roomId);
            socket.emit('lobby-joined', {
                roomId,
                players: result.lobby.players,
                moderator: result.lobby.moderator,
                maxPlayers: result.lobby.maxPlayers,
                wordsPerGame: result.lobby.wordsPerGame
            });
            
            // Notify all players in the room
            io.to(roomId).emit('player-joined', {
                players: result.lobby.players,
                newPlayer: username
            });
        } else {
            socket.emit('error', { message: result.message });
        }
    });

    // Submit words (moderator only)
    socket.on('submit-words', (data) => {
        const { roomId, words, category } = data;
        
        const result = gameManager.submitWords(roomId, socket.id, words, category);
        
        if (result.success) {
            io.to(roomId).emit('words-submitted', {
                category,
                wordCount: words.length,
                ready: true
            });
        } else {
            socket.emit('error', { message: result.message });
        }
    });

    // Start game
    socket.on('start-game', (data) => {
        const { roomId } = data;
        
        const result = gameManager.startGame(roomId, socket.id);
        
        if (result.success) {
            const gameState = result.gameState;
            io.to(roomId).emit('game-started', {
                currentWord: gameState.currentWord.word.split('').map(() => '_'),
                category: gameState.currentWord.category,
                currentPlayer: gameState.currentPlayer,
                players: gameState.players,
                wordNumber: gameState.currentWordIndex + 1,
                totalWords: gameState.totalWords,
                timeLeft: 30
            });
            
            // Start turn timer
            gameManager.startTurnTimer(roomId, io);
        } else {
            socket.emit('error', { message: result.message });
        }
    });

    // Make guess
    socket.on('make-guess', (data) => {
        const { roomId, letter } = data;
        
        const result = gameManager.makeGuess(roomId, socket.id, letter);
        
        if (result.success) {
            const gameState = result.gameState;
            
            io.to(roomId).emit('guess-made', {
                letter,
                player: result.player,
                correct: result.correct,
                currentWord: gameState.displayWord,
                players: gameState.players,
                guessedLetters: gameState.guessedLetters,
                currentPlayer: gameState.currentPlayer,
                scoreChange: result.scoreChange
            });
            
            // Check if word is solved
            if (result.wordSolved) {
                io.to(roomId).emit('word-solved', {
                    solver: result.player,
                    word: gameState.currentWord.word,
                    players: gameState.players
                });
                
                // Move to next word or end game
                setTimeout(() => {
                    const nextResult = gameManager.nextWord(roomId);
                    if (nextResult.success) {
                        if (nextResult.gameEnded) {
                            io.to(roomId).emit('game-ended', {
                                finalScores: nextResult.finalScores,
                                winner: nextResult.winner
                            });
                        } else {
                            const newGameState = nextResult.gameState;
                            io.to(roomId).emit('next-word', {
                                currentWord: newGameState.currentWord.word.split('').map(() => '_'),
                                category: newGameState.currentWord.category,
                                currentPlayer: newGameState.currentPlayer,
                                players: newGameState.players,
                                wordNumber: newGameState.currentWordIndex + 1,
                                totalWords: newGameState.totalWords,
                                guessedLetters: []
                            });
                            gameManager.startTurnTimer(roomId, io);
                        }
                    }
                }, 3000);
            } else {
                // Continue with next player if game is still active
                if (gameState.status === 'active') {
                    gameManager.startTurnTimer(roomId, io);
                }
            }
        } else {
            socket.emit('error', { message: result.message });
        }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        gameManager.handleDisconnection(socket.id, io);
    });
});

// Export the app for Vercel
module.exports = app;
module.exports.io = io;
module.exports.server = server;

// For local development
if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 3000;
    server.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}

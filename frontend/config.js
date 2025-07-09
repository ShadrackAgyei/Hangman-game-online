// Configuration for the multiplayer hangman game
const CONFIG = {
    // Backend URL - Update this with your Render backend URL
    BACKEND_URL: window.location.hostname === 'localhost' 
        ? 'http://localhost:3000' 
        : 'https://hangman-game-online.onrender.com',
    
    // Game settings
    GAME_SETTINGS: {
        TURN_TIMEOUT: 30000, // 30 seconds
        MAX_PLAYERS: 10,
        MIN_PLAYERS: 2
    },
    
    // UI settings
    UI_SETTINGS: {
        NOTIFICATION_DURATION: 3000, // 3 seconds
        ANIMATION_DURATION: 300 // 0.3 seconds
    }
};

// Make config available globally
window.HANGMAN_CONFIG = CONFIG;

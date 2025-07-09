# Multiplayer Hangman Game

A real-time multiplayer hangman game built with Node.js, Socket.io, and vanilla JavaScript. Players compete in lobbies to guess words within time limits while earning points for correct guesses.

## Features

### Core Game Mechanics
- **Multiplayer Lobbies**: Support for 2-10 players per room
- **Competitive Gameplay**: All players guess the same word simultaneously
- **Multiple Words**: Customizable number of words per game session (3-10)
- **Time Limits**: 30-second countdown for each guess
- **Auto-skip**: Disconnected players are automatically skipped without penalties

### Scoring System
- Starting score: 10 points per player
- Correct letter guess: +1 point
- Incorrect letter guess: -1 point
- Word completion bonus: +1 point
- Real-time scoreboard updates

### User Roles
- **Moderator**: Creates lobby, submits words, controls game flow
- **Players**: Compete to guess letters and solve words

### Word Categories
- Animals
- Countries
- Movies
- Sports
- Food
- Technology
- Custom (moderator-defined)

## Installation

1. Clone or download the project
2. Navigate to the project directory
3. Install dependencies:
   ```bash
   npm install
   ```

## Running the Game

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

The game will be available at `http://localhost:3000`

## How to Play

### For Moderators:
1. Click "Create Game" from the main menu
2. Enter your name and configure game settings
3. Share the room code with players
4. Select a word category and enter words (one per line)
5. Click "Submit Words" then "Start Game"

### For Players:
1. Click "Join Game" from the main menu
2. Enter your name and the room code
3. Wait for the moderator to start the game
4. Take turns guessing letters within the 30-second time limit
5. Earn points for correct guesses and word completions

## Game Rules

1. **Turn Order**: Players take turns in the order they joined
2. **Time Limit**: Each player has 30 seconds to make a guess
3. **Scoring**:
   - Correct letter: +1 point
   - Incorrect letter: -1 point (minimum 0 points)
   - Solving word: +1 bonus point
4. **Word Progression**: Game moves to next word when solved
5. **Winning**: Player with highest score at the end wins

## Technical Features

- **Real-time Communication**: Socket.io for instant updates
- **Responsive Design**: Works on desktop and mobile devices
- **Session-based**: No accounts required, just usernames
- **Disconnect Handling**: Graceful handling of player disconnections
- **Visual Feedback**: Hangman drawing, score animations, notifications

## File Structure

```
multiplayer-hangman/
├── server/
│   ├── server.js          # Main server file
│   └── gameManager.js     # Game logic and state management
├── public/
│   ├── index.html         # Main HTML file
│   ├── css/
│   │   └── style.css      # Styling
│   └── js/
│       └── app.js         # Client-side game logic
└── package.json           # Dependencies and scripts
```

## Customization

### Adding New Word Categories
Edit the `wordCategories` object in `server/gameManager.js`:

```javascript
this.wordCategories = {
    'Animals': ['elephant', 'giraffe', ...],
    'Your Category': ['word1', 'word2', ...]
};
```

### Modifying Game Settings
- Change default timer duration in `gameManager.js` (search for `timeLeft = 30`)
- Adjust starting points in `gameManager.js` (search for `score: 10`)
- Modify max players or words per game in the HTML form options

## Deployment

The game can be deployed to any Node.js hosting platform:

### Heroku
1. Create a new Heroku app
2. Connect your repository
3. Deploy the main branch

### Other Platforms
- Ensure Node.js environment
- Set PORT environment variable if required
- Run `npm start` to launch the server

## Browser Support

- Chrome/Chromium (recommended)
- Firefox
- Safari
- Edge

## License

MIT License - feel free to modify and distribute as needed.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## Support

For issues or questions:
1. Check the browser console for error messages
2. Ensure all players have stable internet connections
3. Verify that the server is running and accessible
4. Try refreshing the page if connection issues occur

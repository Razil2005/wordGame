<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# Guess the Word - Multiplayer Game

This is a real-time multiplayer word guessing game built with Node.js, Express, Socket.io, and vanilla JavaScript.

## Project Structure
- `server.js` - Main server file with Socket.io game logic
- `public/` - Frontend files (HTML, CSS, JavaScript)
- Game uses Socket.io for real-time communication between players
- Health system similar to Hangman
- Room-based multiplayer gameplay

## Development Guidelines
- Follow ES6+ JavaScript standards
- Use Socket.io events for real-time updates
- Maintain responsive design for mobile devices
- Keep game state synchronized between all clients
- Handle edge cases like player disconnections gracefully

## Game Features
- Room creation and joining with codes
- Real-time multiplayer gameplay
- Health system (hearts that decrease with wrong guesses)
- Word hints system
- Modern, responsive UI
- Player management (host/guest roles)

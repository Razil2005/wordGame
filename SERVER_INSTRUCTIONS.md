# Server Start Instructions

The "Create Room" button is not working because the server is not running.

## To Start the Server:

### Option 1: Double-click the batch file
1. Double-click `start.bat` in the newgame folder
2. Wait for "Server running on port 3001" message
3. Refresh the webpage

### Option 2: Manual command
1. Open Command Prompt or PowerShell
2. Navigate to: cd "c:\Users\Razil\Desktop\newgame"
3. Run: node server.js
4. Wait for "Server running on port 3001" message
5. Refresh the webpage

### Option 3: Use VS Code terminal
1. Open terminal in VS Code
2. Make sure you're in the newgame directory
3. Run: node server.js
4. Wait for server to start
5. Refresh the webpage

## How to verify it's working:
1. Open http://localhost:3001 in your browser
2. Check the browser console (F12) for connection messages
3. You can click the "🔌 Test Connection" button to verify
4. The notification area will show "Connected to server!" when working

## If still not working:
1. Check if port 3001 is already in use
2. Try running: taskkill /F /IM node.exe (to stop any existing node processes)
3. Then start the server again

The server must be running for the multiplayer game to work!

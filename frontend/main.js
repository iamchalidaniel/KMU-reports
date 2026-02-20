const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const isDev = process.env.NODE_ENV === 'development';

let backendProcess = null;
let mainWindow = null;

// Start the backend server
function startBackend() {
    const backendPath = path.join(__dirname, '..', 'backend');
    const backendScript = isDev ? 'npm run dev' : 'npm start';

    console.log('Starting backend server from:', backendPath);
    console.log('Backend script:', backendScript);

    backendProcess = spawn(backendScript, [], {
        cwd: backendPath,
        shell: true,
        stdio: 'pipe'
    });

    backendProcess.stdout.on('data', (data) => {
        console.log('Backend:', data.toString());
    });

    backendProcess.stderr.on('data', (data) => {
        console.error('Backend Error:', data.toString());
    });

    backendProcess.on('close', (code) => {
        console.log('Backend process exited with code:', code);
    });

    backendProcess.on('error', (error) => {
        console.error('Backend process error:', error);
    });
}

function createWindow() {
    // Create window
    const win = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
        },
        icon: path.join(__dirname, 'public/kmu_logo.png')
    });
    
    // Set window title
    win.setTitle('KMU Reports');

    // Show window when ready to prevent visual flash
    win.once('ready-to-show', () => {
        win.show();
    });

    // Load the app
    if (isDev) {
        // Development: load from Next.js dev server
        const startUrl = 'http://localhost:3000';
        console.log('Loading app from:', startUrl);
        win.loadURL(startUrl);
    } else {
        // Production: load from backend server
        setTimeout(() => {
            const startUrl = 'http://localhost:5000';
            console.log('Loading app from:', startUrl);
            win.loadURL(startUrl);
        }, 5000); // Give backend 5 seconds to start
    }

    // Open DevTools in development
    if (isDev) {
        win.webContents.openDevTools();
    }

    // Handle window closed
    win.on('closed', () => {
        mainWindow = null;
    });
}

app.whenReady().then(() => {
    startBackend();
    createWindow();
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

app.on('before-quit', () => {
    if (backendProcess) {
        console.log('Shutting down backend...');
        backendProcess.kill();
    }
});

app.on('quit', () => {
    if (backendProcess) {
        backendProcess.kill();
    }
});
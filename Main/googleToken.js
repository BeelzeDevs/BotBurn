import { google } from 'googleapis';
import readline from 'readline';
import { readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get directory name (since __dirname is not available in ESM)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CREDENTIALS_PATH = path.join(__dirname, '..', 'Auth', 'credentials.json');
const credentials = JSON.parse(readFileSync(CREDENTIALS_PATH));
const { client_secret, client_id, redirect_uris } = credentials.web;

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
const TOKEN_PATH = path.join(__dirname, 'token.json');

const auth = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

console.log('Open the following URL in your browser and authorize the app:');
console.log(auth.generateAuthUrl({ access_type: 'offline', scope: SCOPES }));

rl.question('Enter the code from the page: ', async (code) => {
    const { tokens } = await auth.getToken(code);
    writeFileSync(TOKEN_PATH, JSON.stringify(tokens));
    console.log('New refresh token saved to token.json');
    rl.close();
});

import { google } from 'googleapis';
import { readFileSync, existsSync, writeFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';



// Google bot credentials
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CREDENTIALS_PATH = path.join(__dirname, '..', 'Auth', 'credentials.json');
const credentials = JSON.parse(readFileSync(CREDENTIALS_PATH));
const { client_secret, client_id, redirect_uris } = credentials.web;

// Configuracion especial para que lea el dotenv dentro del Main
// const envPath = path.join(__dirname, '..', 'Main', '.env');
// dotenv.config({ path: envPath });

// solo para deploy
dotenv.config();
// Google Sheets API 
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
const TOKEN_PATH = path.join(__dirname, '..', 'Main', 'token.json');

// Configuración de las credenciales de OAuth2
const CLIENT_ID = client_id;
const CLIENT_SECRET = client_secret;
const tokenData = JSON.parse(readFileSync(TOKEN_PATH));

// Crear un cliente OAuth2
const auth = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET);

// Configurar el refresh_token para que no tengas que iniciar sesión cada vez
auth.setCredentials(tokenData);

// 🔄 Function que automáticamente hace el refresh del token cuando expira
auth.on('tokens', (newTokens) => {
  if (newTokens.refresh_token) {
      tokenData.refresh_token = newTokens.refresh_token; // Save new refresh token if provided
  }
  tokenData.access_token = newTokens.access_token;
  tokenData.expiry_date = newTokens.expiry_date;

  writeFileSync(TOKEN_PATH, JSON.stringify(tokenData)); // Save updated tokens
  console.log('🔄 Google API token refreshed and saved!');
});





// Crear una instancia de Google Sheets API
const sheets = google.sheets({ version: 'v4', auth });

// ID de la hoja de cálculo y el rango que deseas leer
const SPREADSHEET_ID = '1dp1-Wxunl3mAQNLwLM-SdsbkniAduvRBJNNMqx2vWXE';  // El ID de tu Google Sheets
const memberCount = 100;
const RANGE = `Hoja1!A1:C${memberCount}`;  // Range del sheet
const RANGE_GameList = `Hoja1!E1:E1007`;
// Función para obtener los datos de Google Sheets
const getSpreadSheet = async () => {
  try {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: RANGE,
    });
    const data = res.data.values || [];
    return data;  
  } catch (error) {
    console.error('Error al leer la hoja de cálculo:', error);
    return [];
  }
};

const getUsernamesTXT = async () =>  {
    try{
      const resp = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: RANGE_GameList,
      });
      const data = resp.data.values || [];
      return data.flat();
    }catch(error){
      console.error('Error al leer los usernames.txt de la columna E', error.response?.data || error.message);
      return [];
    }
  };

const activeRoll = async (username) => {
  const data = await getSpreadSheet();
  const users = data.map((user)=> user[0]);
  
  let indexToUpdate = data.length + 1;

  for(let i = 0 ; i < data.length;i++){
    if(data[i][0] == username){
      indexToUpdate = i + 1;
    }
  }

  const newRange = `Hoja1!A${indexToUpdate}:B${indexToUpdate}`;
  try {
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: newRange,
      valueInputOption: 'RAW',
      resource: {
        values: [[username,'TRUE']],  // Agrega el nombre del usuario
      },
    });
    return `Roll dado de alta exitosamente en Google Sheets: ${username}`;
  } catch (err) {
    return 'Error al activar roll en Google Sheets';
  }
};
const inactiveRoll = async (username) =>{
  const data = await getSpreadSheet();
  const users = data.map((user)=> user[0]);
  
  let indexToDelete = null;

  // Encuentra indice a cambiar el bool para el estado
  for(let i = 0 ; i < data.length;i++){
    if(data[i][0] == username){
      indexToDelete = i + 1;
    }
  }
  if(indexToDelete == null) return;

  const RangeToUpdate = `Hoja1!A${indexToDelete}:B${indexToDelete}`;
  try {
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: RangeToUpdate,
      valueInputOption: 'RAW',
      resource: {
        values: [[username,'FALSE']],  // Cambia el estado del usuario a false
      },
    });
    return `Roll eliminado lógicamente de Google Sheets: ${username}`;
  } catch (err) {
    return 'Error al eliminar lógicamente Google Sheets:';
  }

}
const createUserToSheet = async (username,gameID) =>{
  const data = await getSpreadSheet();
  
  let indexToCreate = data.length + 1;

  for(let i = 0 ; i < data.length;i++){
    if(data[i][0] == username){
      indexToCreate = i + 1;
    }
  }

  const newRange = `Hoja1!A${indexToCreate}:C${indexToCreate}`;
  try {
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: newRange,
      valueInputOption: 'RAW',
      resource: {
        values: [[username,'FALSE',gameID]],  // Agrega el nombre del usuario
      },
    });
    return `✅ **Success: ${username} - ${gameID}**`;
  } catch (err) {
    return '⛔**Error:** create user failed conection';
  }
}

const reqAllActive = async()=>{
  const data = await getSpreadSheet();
  const users = data.filter((user)=> user[1] === 'TRUE');
  
  if(users.length === 0) return "No users rolling right now";

  let message = '📢 User rolling right now:\n';
  users.forEach(user => {
    message += `\n・💫 ${user[0]} - ${user[2]}`;
  });
  return message;
}
const googleStatus = async()=>{
  const data = await getSpreadSheet();
  let status = "";
  if(data.length > 0){
    return "・✅ **Connected to Google Sheets**\n";
  }
  return "・❌ **Error in conection to Google Sheets**\n";
}

export { activeRoll, inactiveRoll, createUserToSheet,reqAllActive,getSpreadSheet,googleStatus, getUsernamesTXT};

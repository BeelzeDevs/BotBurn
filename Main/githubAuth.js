import axios from 'axios';
import {getSpreadSheet} from '../Main/googleAuth.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Configuracion especial para que lea el dotenv dentro del Main
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);
// const envPath = path.join(__dirname, '..', 'Main', '.env');

// dotenv.config({ path: envPath });

// solo para deploy
dotenv.config();

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const REPO_OWNER = "BotGroup123";
const REPO_NAME = "botIds3";
const FILE_PATH = "ids.txt";
const BRANCH = "main";

const updateGitHubFile = async () => {
    try {
      const data = await getSpreadSheet();
      
      // Convierte los datos a formato de texto
      let fileContent = data.filter(item => item[1] === 'TRUE').map(item => item[2]).join("\n");
        
      // URL de la API de GitHub 
      const fileUrl = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`;
  
      // Obtiene la información actual del archivo para obtener el SHA
      const { data: fileData } = await axios.get(fileUrl, {
        headers: {
          Authorization: `token ${GITHUB_TOKEN}`,
          Accept: "application/vnd.github.v3+json",
        },
      });
  
      const sha = fileData.sha; // SHA necesario para actualizar el archivo
  
      // Hace el commit con el nuevo contenido
      const response = await axios.put(fileUrl, {
        message: "Actualización automática desde el bot",
        content: Buffer.from(fileContent).toString("base64"), // Codifica en Base64
        sha: sha,
        branch: BRANCH,
      }, {
        headers: {
          Authorization: `token ${GITHUB_TOKEN}`,
          Accept: "application/vnd.github.v3+json",
        },
      });
  
      return `✅ Archivo actualizado en GitHub: ${response.data.commit.html_url}`;
    } catch (error) {
      console.error("Error al actualizar GitHub:", error.response?.data || error);
      return "⛔ Error al actualizar el archivo en GitHub.";
    }
  };
const githubStatus = async () =>{
  try {
    const data = await getSpreadSheet();
    
    // Convierte los datos a formato de texto
    let fileContent = data.filter(item => item[1] === 'TRUE').map(item => item[2]).join("\n");
      
    // URL de la API de GitHub 
    const fileUrl = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`;

    // Obtiene la información actual del archivo para obtener el SHA
    const { data: fileData } = await axios.get(fileUrl, 
    {
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
        Accept: "application/vnd.github.v3+json",
      },
    });

    const sha = fileData.sha; // SHA necesario para actualizar el archivo

    // Hace el commit con el nuevo contenido
    const response = await axios.put(fileUrl, 
    {
      message: "Actualización automática desde el bot",
      content: Buffer.from(fileContent).toString("base64"), // Codifica en Base64
      sha: sha,
      branch: BRANCH,
    }, {
      headers: 
      {
        Authorization: `token ${GITHUB_TOKEN}`,
        Accept: "application/vnd.github.v3+json",
      },
    });
    
    return `・✅ **Connected to GitHub**\n`;
    } catch (error) {
      return "・❌ **Error in conection to Discord**\n";
    }
}


export {updateGitHubFile,githubStatus};
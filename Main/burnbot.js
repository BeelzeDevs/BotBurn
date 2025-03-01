import { createServer } from 'http'; // solo es usado porque el deploy en render lo necesita, no hace nada
import { Client, GatewayIntentBits, Partials, AttachmentBuilder } from 'discord.js';
import { activeRoll, inactiveRoll, createUserToSheet,reqAllActive,googleStatus, getUsernamesTXT } from './googleAuth.js';
import {updateGitHubFile,githubStatus} from './githubAuth.js';
import { google } from 'googleapis';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.join(__dirname, '..', 'Main', '.env');
dotenv.config({ path: envPath });

// solo para deploy
// dotenv.config();

let rollingUsers = [];

const BOT_TOKEN = process.env.BOT_TOKEN;
// Configura el cliente de Discord
const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
      GatewayIntentBits.GuildMessageReactions,
    ],
    partials: [
        Partials.Message,
        Partials.Channel,
        Partials.Reaction,
    ],
  });


client.on('messageCreate', async (message) => {
    // if (message.author.bot) return;

    const prefixAddGameID = "/bot add ";
    const prefixActiveRollers = "/bot actives";
    const prefixCommands = "/bot help";
    const prefixStatus = "/bot status";
    const prefixGenerateSuffix = "/bot suffix ";
    const regTestNumber = /^\d{16}$/;

    if (message.content.startsWith(prefixAddGameID)) {
        // Extrae el número de id ingresado
        const content = message.content.slice(prefixAddGameID.length).trim();
        // Reg expresion para verificar que sea un número
        if (!regTestNumber.test(content)) { 
            message.reply(`**⛔Error: ${(message.author.username).toUpperCase()}** Number is invalid. Bot add <game ID>. Try Again.`);
            return;
        }
        
        const messageToReply = await createUserToSheet(message.author.username,content);
        message.reply(messageToReply);
        
    }

    if(message.content.startsWith(prefixGenerateSuffix))
    {
        const suffix = message.content.slice(prefixGenerateSuffix.length).toUpperCase();
        if(suffix.length > 1 && suffix.length <= 3) {
            const usernames = await getUsernamesTXT();
            const addPrefix = usernames.map((item)=> item.concat(suffix));
            const filteredusernames = addPrefix.filter((item)=> item.length < 14);
            let messageToReply = "";
            filteredusernames.forEach(element => {
                messageToReply += element + "\n";
            });

            fs.writeFileSync('pokemon_list.txt', messageToReply);
            const fileOfNames = new AttachmentBuilder('pokemon_list.txt');
            message.reply({ content: '**Usernames.txt:**', files: [fileOfNames] });
            // const chunkOfMessage = messageToReply.match(/.{1,2000}/g); // Divide en partes de 4000 caracteres o menos
            // for (const chunk of chunkOfMessage) {
            //     await message.reply(chunk);
            // }
        }else{
            message.reply(`**⛔Error: ${(message.author.username).toUpperCase()} ** /bot suffix <ID>.\n**- ID must be 2 or 3 chars max**`);
        }
         
    }

    if(message.content.startsWith(prefixCommands))
    {
        let messageToReply = "📕 Commands:\n`\t・/bot add <Game ID>`";
        messageToReply += "\n `/t・/bot suffix`";
        messageToReply += "\n`\t・/bot status`";
        messageToReply += "\n`\t・/bot help`";
        message.reply(messageToReply);
    }

    if (message.content.startsWith(prefixStatus)) {
        let statusMessage = "🔍 **Bot Status:**\n\n";

        // 1️- Verificar conexión a Discord
        statusMessage += "・✅ **Connected to Discord**\n";

        // 2- Verificar conexión a Google Sheets
        let googleStatusMessage = await googleStatus();
        statusMessage += googleStatusMessage;

        // 3 - Verificar conexión a GitHub
        let discordStatusMessage = await githubStatus();
        statusMessage += discordStatusMessage;

        // Enviar el estado al canal
        message.reply(`${statusMessage}`);
    }  
    

});

client.once('ready', async () => {
    console.log(`¡Bot conectado como ${client.user.tag}!`);

});

// Configura un servidor HTTP vacío para que Render detecte que la aplicación está en ejecución
// const server = createServer((req, res) => {
//     console.log(`Solicitud recibida: ${req.method} ${req.url}`); // 🔍 Verifica si hay actividad
//     res.writeHead(200, { 'Content-Type': 'text/plain' });
//     res.end('Bot funcionando');
// });

// const PORT = process.env.PORT || 3000;
// server.listen(PORT, () => {
//     console.log(`Servidor HTTP corriendo en el puerto ${PORT}`);
// });

// Inicia sesión con el token de tu bot de Discord
client.login(BOT_TOKEN);
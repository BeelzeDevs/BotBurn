import { Client, GatewayIntentBits, Partials } from 'discord.js';
import { activeRoll, inactiveRoll, createUserToSheet,reqAllActive,googleStatus } from './googleAuth.js';
import {updateGitHubFile,githubStatus} from './githubAuth.js';
import { google } from 'googleapis';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.join(__dirname, '..', 'Main', '.env');

dotenv.config({ path: envPath });

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


// Evento cuando una reacción es agregada
client.on('messageReactionAdd', async (reaction, user) => {
    if (reaction.partial) {
        try {
            await reaction.fetch();
        } catch (error) {
            return;
        }
    }
    
    if (reaction.emoji.name === '⏯️' && reaction.message.channel.name === '▶-start-⏳') {
      // Agregar el nombre del usuario a Google Sheets
      await activeRoll(user.username);
      let messageToReply = await updateGitHubFile();
      console.log(messageToReply);
    }
});

client.on('messageReactionRemove', async(reaction,user)=>{
    if (reaction.partial) {
        try {
            await reaction.fetch();
        } catch (error) {
            console.error('Error al obtener la reacción:', error);
            return;
        }
    }

    if (reaction.emoji.name === '⏯️' && reaction.message.channel.name === '▶-start-⏳') {
        // Cambiar el estado del nombre del usuario en Google Sheets
        await inactiveRoll(user.username);
        let messageToReply = await updateGitHubFile();
        console.log(messageToReply);
      }
});

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    const prefixAddGameID = "/bot add ";
    const prefixActiveRollers = "/bot actives";
    const prefixCommands = "/bot help";
    const prefixStatus = "/bot status";
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
    if(message.content.startsWith(prefixActiveRollers))
    {
        const messageToReply = await reqAllActive();
        message.reply(messageToReply);
    }
    if(message.content.startsWith(prefixCommands))
    {
        let messageToReply = "📕 Commands:\n`\t・/bot add <Game ID>`";
        messageToReply += "\n`\t・/bot actives`";
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

    // ID del mensaje fijo
    const MESSAGE_ID = '1338736226815049748';

    // Encuentra el canal donde está el mensaje
    const channel = client.channels.cache.find(c => c.name === '▶-start-⏳');
    if (!channel) {
        return;
    }

    // Función que reacciona al mensaje fijo
    const addReaction = async () => {
        try {
            const message = await channel.messages.fetch(MESSAGE_ID); // Obtiene el mensaje por su ID
            
            if (message) {
                await message.react('🔄'); // Emoji de reloj de arena
                console.log(`Reacción 🔄 agregada al mensaje ID: ${MESSAGE_ID}`);
            }
        } catch (error) {
            console.error(`Error al reaccionar al mensaje con ID ${MESSAGE_ID}:`, error);
        }
    };

    // Ejecuta la función cada 25 minutos
    addReaction();
    setInterval(addReaction, 25 * 60 * 1000);
});
// Inicia sesión con el token de tu bot de Discord
client.login(BOT_TOKEN);
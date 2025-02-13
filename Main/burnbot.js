import { Client, GatewayIntentBits, Partials } from 'discord.js';
import { activeRoll, inactiveRoll, createUserToSheet,reqAllActive  } from './googleAuth.js';
import {updateGitHubFile} from './githubAuth.js';
import dotenv from 'dotenv';

dotenv.config();

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



client.once('ready', () => {
    console.log(`¡Bot conectado como ${client.user.tag}!`);
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
        message.reply(messageToReply);
    }
        
});

// Inicia sesión con el token de tu bot de Discord
client.login(BOT_TOKEN);
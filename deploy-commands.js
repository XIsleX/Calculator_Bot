require('dotenv').config();
const { REST, Routes } = require('discord.js');

const commands = [
  {
    name: 'calc',
    description: 'Open level calculator'
  }
];

const rest = new REST({ version: '10' }).setToken('YOUR_BOT_TOKEN');

(async () => {
  try {
    console.log('Registering commands...');
    console.log("TOKEN:", process.env.TOKEN?.slice(0, 10));
    console.log("TOKEN LENGTH:", process.env.TOKEN.length);
    console.log("TOKEN LAST 5:", process.env.TOKEN.slice(-5));
    await rest.put(
      Routes.applicationGuildCommands(
        process.env.CLIENT_ID,
        "YOUR_SERVER_ID"
        ),
      { body: commands }
    );
    console.log('Done.');
  } catch (error) {
    console.error(error);
  }
})();
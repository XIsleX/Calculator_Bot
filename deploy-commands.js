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
    await rest.put(
      Routes.applicationCommands('1407286198854225971'),
      { body: commands }
    );
    console.log('Done.');
  } catch (error) {
    console.error(error);
  }
})();
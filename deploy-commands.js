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
    await rest.put(
      Routes.applicationCommands('YOUR_CLIENT_ID'),
      { body: commands }
    );
    console.log('Done.');
  } catch (error) {
    console.error(error);
  }
})();
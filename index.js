// setup.js - RUN ONCE LOCALLY
require("dotenv").config();
const { Client, GatewayIntentBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, AttachmentBuilder } = require("discord.js");

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once("ready", async () => {
  console.log(`Sending button to channel...`);
  const channel = await client.channels.fetch("1483503488246874293");

  const button = new ButtonBuilder()
    .setCustomId("levelCalcButton")
    .setLabel("Calculate Level")
    .setStyle(ButtonStyle.Success);

  const row = new ActionRowBuilder().addComponents(button);
  const file = new AttachmentBuilder("./calculateYourXP.png", { name: "calculateYourXP.png" });

  await channel.send({ files: [file], components: [row] });
  console.log("Success! You can stop this script now.");
  process.exit();
});

client.login(process.env.TOKEN);
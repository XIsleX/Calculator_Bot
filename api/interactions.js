const { verifyKey } = require('discord-interactions');
const {
  EmbedBuilder,
  ActionRowBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle
} = require('discord.js');

// --- Helper Functions ---
function getXpForLevel(level) {
  let xp = 0;
  for (let i = 1; i < level; i++) {
    xp += 50 * (Math.pow(i, 2) + 2);
  }
  return xp;
}

function calculatePacks(startLevel, targetLevel, currentXP = 0) {
  let totalXp = 0;

  for (let lvl = startLevel; lvl < targetLevel; lvl++) {
    totalXp += 50 * (Math.pow(lvl, 2) + 2);
  }

  totalXp -= currentXP;
  if (totalXp < 0) totalXp = 0;

  let totalAmt = totalXp;
  let small = 0, big = 0, large = 0, maui_wowie = 0;

  if (totalAmt >= 1000000) {
    maui_wowie += Math.floor(totalAmt / 1000000);
    totalAmt %= 1000000;
  }
  if (totalAmt >= 500000) {
    large += Math.floor(totalAmt / 500000);
    totalAmt %= 500000;
  }
  if (totalAmt >= 250000) {
    big += Math.floor(totalAmt / 250000);
    totalAmt %= 250000;
  }
  if (totalAmt >= 125000) {
    small += Math.floor(totalAmt / 125000);
    totalAmt %= 125000;
  }
  if (totalAmt !== 0) small++;

  if (small >= 2) { small = 0; big++; }
  if (big >= 2) { big = 0; large++; }
  if (large >= 2) { large = 0; maui_wowie++; }

  let cost = (maui_wowie * 3000) + (large * 1600) + (big * 1100) + (small * 7500);

  let cost_parts = [];
  if (Math.floor(cost / 10000) > 0)
    cost_parts.push(`• ${Math.floor(cost / 10000)} **BGL(s)**`);
  if (Math.floor(cost / 100 % 100) > 0)
    cost_parts.push(`• ${Math.floor(cost / 100 % 100)} **DLs**`);
  if (cost % 100 > 0)
    cost_parts.push(`• ${cost % 100} **WLs**`);

  return {
    txp: totalXp,
    maui_wowie_pack: maui_wowie,
    large_pack: large,
    big_pack: big,
    small_pack: small,
    cost_total: cost_parts.join("\n")
  };
}

function calcTime(result) {
  let minutes =
    (result.small_pack * 5) +
    (result.big_pack * 10) +
    (result.large_pack * 15) +
    (result.maui_wowie_pack * 30);

  if (minutes <= 30) return `~${minutes} minutes`;
  let hours = Math.ceil(minutes / 60);
  return `~${hours} hour${hours > 1 ? "s" : ""}`;
}

// --- MAIN HANDLER ---
module.exports = async (req, res) => {
  try {
    if (req.method !== 'POST') {
      return res.status(405).send('Method Not Allowed');
    }

    const signature = req.headers['x-signature-ed25519'];
    const timestamp = req.headers['x-signature-timestamp'];

    // ✅ CRITICAL FIX: use BUFFER (not string)
    const chunks = [];
    for await (const chunk of req) {
      chunks.push(chunk);
    }
    const rawBodyBuffer = Buffer.concat(chunks);
    const rawBody = rawBodyBuffer.toString('utf8');

    // ✅ VERIFY SIGNATURE (with buffer)
    const isValidRequest = await verifyKey(
      rawBodyBuffer,
      signature,
      timestamp,
      process.env.PUBLIC_KEY
    );

    if (!isValidRequest) {
      console.log("❌ Invalid signature");
      return res.status(401).send('Invalid request signature');
    }

    const interaction = JSON.parse(rawBody);

    // ✅ PING (REQUIRED)
    if (interaction.type === 1) {
      console.log("✅ Ping received");
      return res.status(200).json({ type: 1 });
    }

    // ✅ BUTTON → MODAL
    if (
      interaction.type === 3 &&
      interaction.data.custom_id === "levelCalcButton"
    ) {
      const modal = new ModalBuilder()
        .setCustomId("levelCalcModal")
        .setTitle("Level Calculator");

      const currentLvlInput = new TextInputBuilder()
        .setCustomId("currentLvl")
        .setLabel("Current Level")
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

      const currentXPInput = new TextInputBuilder()
        .setCustomId("currentXP")
        .setLabel("Current XP (optional)")
        .setStyle(TextInputStyle.Short)
        .setRequired(false);

      const targetLvlInput = new TextInputBuilder()
        .setCustomId("targetLvl")
        .setLabel("Target Level")
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

      modal.addComponents(
        new ActionRowBuilder().addComponents(currentLvlInput),
        new ActionRowBuilder().addComponents(currentXPInput),
        new ActionRowBuilder().addComponents(targetLvlInput)
      );

      return res.status(200).json({
        type: 9,
        data: modal.toJSON()
      });
    }

    // ✅ MODAL SUBMIT
    if (
      interaction.type === 5 &&
      interaction.data.custom_id === "levelCalcModal"
    ) {
      const components = interaction.data.components;

      const currentLvl = parseInt(components[0].components[0].value);
      const currentXP = parseInt(components[1].components[0].value || "0");
      const targetLvl = parseInt(components[2].components[0].value);

      const sendError = (msg) =>
        res.status(200).json({
          type: 4,
          data: { content: msg, flags: 64 }
        });

      if (isNaN(currentLvl) || currentLvl < 1)
        return sendError("⚠️ Invalid current level.");

      if (isNaN(targetLvl) || targetLvl < 1 || targetLvl > 125)
        return sendError("⚠️ Target level must be 1–125.");

      if (targetLvl <= currentLvl)
        return sendError("⚠️ Target must be higher than current.");

      if (isNaN(currentXP) || currentXP < 0)
        return sendError("⚠️ Invalid XP.");

      const minXp = getXpForLevel(currentLvl);
      const maxXp = getXpForLevel(currentLvl + 1) - 1;

      if (currentXP < minXp || currentXP > maxXp) {
        return sendError(`⚠️ XP must be between ${minXp} and ${maxXp}.`);
      }

      const result = calculatePacks(currentLvl, targetLvl, currentXP);

      const embed = new EmbedBuilder()
        .setTitle("📊 Level Calculation Result")
        .setColor(0x00AE86)
        .setDescription(
          `**XP Needed:** ${result.txp.toLocaleString()}\n\n` +
          `**Maui Wowie:** ${result.maui_wowie_pack}\n` +
          `**Large:** ${result.large_pack}\n` +
          `**Big:** ${result.big_pack}\n` +
          `**Small:** ${result.small_pack}\n\n` +
          `**Cost:**\n${result.cost_total}\n\n` +
          `**Time:** ${calcTime(result)}`
        );

      return res.status(200).json({
        type: 4,
        data: {
          embeds: [embed.toJSON()],
          flags: 64
        }
      });
    }

    return res.status(400).send('Unknown interaction');

  } catch (err) {
    console.error("🔥 ERROR:", err);
    return res.status(500).send('Internal Server Error');
  }
};

// ✅ REQUIRED for Vercel
module.exports.config = {
  api: {
    bodyParser: false,
  },
};
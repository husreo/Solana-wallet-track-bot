const {
  SlashCommandBuilder,
  ActionRowBuilder,
  EmbedBuilder,
} = require("discord.js");
const Discord = require("discord.js");
const { Connection, PublicKey, LAMPORTS_PER_SOL } = require("@solana/web3.js");

const wait = require("node:timers/promises").setTimeout;
const {
  getMultiplePairs,
  ownersInfo,
  getMarketSniper,
  solanaConnection,
} = require("../utiles/index");

const channels = [
  "1245149383192743986",
  "1245149414310547578",
  "1245149443850895382",
  "1245149509814718554",
  "1245149539682222091",
  "1245149567339593749",
  "1245149614038974615",
  "1245149641385705484",
  "1245149664890851338",
  "1245149695739822160",
  "1245149719643291769",
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName("scan")
    .setDescription("!")
    .addStringOption((option) =>
      option.setName("mint").setDescription("Enter a token mint")
    ),
  async execute(interaction) {
    await interaction.deferReply();
    const mint = interaction.options.getString("mint");
    const data = await getMarketSniper(mint);
    if (!data) {
      await interaction.followUp("Market not created!");
      return;
    }
    let moonEmbed1 = new EmbedBuilder()
      .setColor(0x6058f3)
      .setTitle("Spy snipers")
      .addFields({ name: `Contract`, value: `\`${mint}\`` })
      .addFields({
        name: `Market ID`,
        value: `\`${data.market_key.toBase58()}\``,
      });
    const snipers = data.sniper;
    let sniperList = "";
    let fieldCount = 0;
    if (snipers.length === 0) {
      moonEmbed1.setDescription("There's no spamming because this lp was already created or still no snipers yet.")
    }
    for (let index = 0; index < snipers.length; index++) {
      // const balance = await solanaConnection.getBalance(
      //   new PublicKey(snipers[index])
      // );
      const sniper = `:orange_circle: [${snipers[index].pubkey.slice(0, 5)}...${snipers[index].pubkey.slice(snipers[index].pubkey.length - 5, snipers[index].pubkey.length - 1)}](https://solscan.io/token/${snipers[index].pubkey}) | \`${snipers[index].solAmount}\`\n`;

      if (sniperList.length + sniper.length > 1024) {
        moonEmbed1.addFields({
          name: `Snipers ${fieldCount + 1}`,
          value: sniperList,
        });
        sniperList = "";
        fieldCount++;
        if (fieldCount * 1024 > 6000) {
          await interaction.followUp({ embeds: [moonEmbed1] });

          moonEmbed1 = new EmbedBuilder()
          .setColor(0x6058f3)
        }
      }
      sniperList += sniper;
    }

    if (sniperList.length > 0) {
      moonEmbed1.addFields({
        name: `Snipers ${fieldCount + 1}`,
        value: sniperList,
      });
    }

    await interaction.followUp({ embeds: [moonEmbed1] });

    console.log("done");
  },
};


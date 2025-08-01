import { EmbedBuilder } from "discord.js"

const PREFIX = "o." // Define the bot's prefix

/**
 * Handles the 'o.help' command.
 * @param {import('discord.js').Message} message
 */
async function handleHelpCommand(message) {
  const helpEmbed = new EmbedBuilder()
    .setColor(0x0099ff) // A nice blue color
    .setTitle("Opal Bot Help")
    .setDescription("Here are all the commands and features Opal offers to keep your server safe and organized!")
    .addFields(
      {
        name: "🛡️ Anti-Raid & Moderation Features",
        value:
          "Opal automatically detects rude behavior, ToS violations, and potential raids. " +
          "It issues warnings, kicks, or bans users based on accumulated offenses. " +
          "It also tracks 'criminal' users across servers.",
      },
      {
        name: "🚨 Automatic Moderation Keywords",
        value:
          "Opal monitors chat for a list of predefined offensive keywords. " +
          "If detected, it will issue a warning. (e.g., try typing 'stupid' or 'idiot')",
      },
      {
        name: "✨ General Keyword Responses",
        value: "Opal can respond to certain keywords in chat. Try typing 'hello' or 'how are you' to see!",
      },
      {
        name: "💬 Slash Commands (Type `/`)",
        value:
          "`/warn <user> [reason]` - Manually warn a user.\n" +
          "`/kick <user> [reason]` - Manually kick a user.\n" +
          "`/ban <user> [reason]` - Manually ban a user and mark them as criminal.\n" +
          "`/checkuser <user>` - View a user's global and server-specific warning history.",
      },
      {
        name: `📝 Prefix Commands (Prefix: \`${PREFIX}\`)`,
        value: `\`${PREFIX}help\` - Displays this help message.\n` + `\`${PREFIX}ping\` - Check if the bot is online.`,
      },
    )
    .setTimestamp()
    .setFooter({ text: "Opal Bot | Protecting your community" })

  await message.channel.send({ embeds: [helpEmbed] })
}

export { handleHelpCommand }

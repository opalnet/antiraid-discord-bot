import { SlashCommandBuilder } from "discord.js"
import { sql } from "../utils/db.js"

export const data = new SlashCommandBuilder()
  .setName("checkuser")
  .setDescription("Checks a user's global and guild-specific warning history.")
  .addUserOption((option) => option.setName("target").setDescription("The user to check").setRequired(true))

/**
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 */
async function execute(interaction) {
  if (!interaction.member.permissions.has("KickMembers")) {
    // Or a more specific permission
    return interaction.reply({ content: "You do not have permission to use this command.", ephemeral: true })
  }

  const targetUser = interaction.options.getUser("target")
  const userId = targetUser.id
  const guildId = interaction.guild.id

  await interaction.deferReply()

  try {
    const [userRecord] = await sql`
      SELECT warnings, is_criminal, last_warning_at FROM users WHERE id = ${userId};
    `

    const [guildMemberRecord] = await sql`
      SELECT warnings_in_guild, is_banned_in_guild FROM guild_members WHERE user_id = ${userId} AND guild_id = ${guildId};
    `

    let replyContent = `**User Report for ${targetUser.globalName || targetUser.username} (${targetUser.id}):**\n\n`

    if (userRecord) {
      replyContent += `**Global Status:**\n`
      replyContent += `  - Total Warnings: ${userRecord.warnings}\n`
      replyContent += `  - Criminal Status: ${userRecord.is_criminal ? "Yes 🚨" : "No"}\n`
      if (userRecord.last_warning_at) {
        replyContent += `  - Last Global Warning: ${new Date(userRecord.last_warning_at).toLocaleString()}\n`
      }
    } else {
      replyContent += `**Global Status:** No global record found for this user.\n`
    }

    replyContent += `\n**Server Status (${interaction.guild.name}):**\n`
    if (guildMemberRecord) {
      replyContent += `  - Warnings in this server: ${guildMemberRecord.warnings_in_guild}\n`
      replyContent += `  - Banned in this server: ${guildMemberRecord.is_banned_in_guild ? "Yes" : "No"}\n`
    } else {
      replyContent += `  - No specific record for this user in this server.\n`
    }

    await interaction.editReply(replyContent)
  } catch (error) {
    console.error(`Error checking user ${targetUser.id}:`, error)
    await interaction.editReply("An error occurred while fetching user information.")
  }
}

export { execute }

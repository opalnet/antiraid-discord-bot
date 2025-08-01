import { SlashCommandBuilder } from "discord.js"
import { issueWarning } from "../utils/moderation.js"

export const data = new SlashCommandBuilder()
  .setName("warn")
  .setDescription("Warns a user for violating rules.")
  .addUserOption((option) => option.setName("target").setDescription("The user to warn").setRequired(true))
  .addStringOption((option) => option.setName("reason").setDescription("The reason for the warning").setRequired(false))

/**
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 */
async function execute(interaction) {
  if (!interaction.member.permissions.has("KickMembers")) {
    return interaction.reply({ content: "You do not have permission to use this command.", ephemeral: true })
  }

  const targetUser = interaction.options.getUser("target")
  const reason = interaction.options.getString("reason") || "No reason provided."

  const member = interaction.guild.members.cache.get(targetUser.id)

  if (!member) {
    return interaction.reply({ content: "That user is not in this server.", ephemeral: true })
  }

  await interaction.deferReply() // Defer reply as warning might take time

  await issueWarning(member, interaction.channel, reason)

  await interaction.editReply(`Successfully warned ${targetUser.globalName || targetUser.username} for: ${reason}`)
}

export { execute }

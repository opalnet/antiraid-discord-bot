import { SlashCommandBuilder } from "discord.js"
import { kickUser } from "../utils/moderation.js"

export const data = new SlashCommandBuilder()
  .setName("kick")
  .setDescription("Kicks a user from the server.")
  .addUserOption((option) => option.setName("target").setDescription("The user to kick").setRequired(true))
  .addStringOption((option) => option.setName("reason").setDescription("The reason for the kick").setRequired(false))

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

  if (member.id === interaction.user.id) {
    return interaction.reply({ content: "You cannot kick yourself!", ephemeral: true })
  }

  if (member.roles.highest.position >= interaction.member.roles.highest.position) {
    return interaction.reply({ content: "You cannot kick someone with an equal or higher role.", ephemeral: true })
  }

  await interaction.deferReply()

  await kickUser(member, interaction.channel, reason)

  await interaction.editReply(`Successfully kicked ${targetUser.globalName || targetUser.username} for: ${reason}`)
}

export { execute }

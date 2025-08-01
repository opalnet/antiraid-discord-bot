import { SlashCommandBuilder } from "discord.js"
import { banUser } from "../utils/moderation.js"

export const data = new SlashCommandBuilder()
  .setName("ban")
  .setDescription("Bans a user from the server and marks them as criminal.")
  .addUserOption((option) => option.setName("target").setDescription("The user to ban").setRequired(true))
  .addStringOption((option) => option.setName("reason").setDescription("The reason for the ban").setRequired(false))

/**
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 */
async function execute(interaction) {
  if (!interaction.member.permissions.has("BanMembers")) {
    return interaction.reply({ content: "You do not have permission to use this command.", ephemeral: true })
  }

  const targetUser = interaction.options.getUser("target")
  const reason = interaction.options.getString("reason") || "No reason provided."

  const member = interaction.guild.members.cache.get(targetUser.id)

  if (!member) {
    return interaction.reply({ content: "That user is not in this server.", ephemeral: true })
  }

  if (member.id === interaction.user.id) {
    return interaction.reply({ content: "You cannot ban yourself!", ephemeral: true })
  }

  if (member.roles.highest.position >= interaction.member.roles.highest.position) {
    return interaction.reply({ content: "You cannot ban someone with an equal or higher role.", ephemeral: true })
  }

  await interaction.deferReply()

  await banUser(member, interaction.channel, reason)

  await interaction.editReply(`Successfully banned ${targetUser.globalName || targetUser.username} for: ${reason}`)
}

export { execute }

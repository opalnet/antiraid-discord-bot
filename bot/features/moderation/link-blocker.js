import { EmbedBuilder } from "discord.js"

// Regex to detect common URL patterns
// This regex is a basic one and might not catch all edge cases or might have false positives.
// For production, consider a more robust URL validation library.
const URL_REGEX = /(https?:\/\/[^\s]+)/g

/**
 * Automatically blocks messages containing links.
 * Deletes the message and sends an embed notification.
 * @param {import('discord.js').Message} message
 * @returns {Promise<boolean>} True if a link was detected and action was taken, false otherwise.
 */
async function handleLinkBlocking(message) {
  if (!message.guild || !message.member) return false // Only in guilds, and ensure member is available

  const messageContent = message.content
  const detectedLinks = messageContent.match(URL_REGEX)

  if (detectedLinks && detectedLinks.length > 0) {
    try {
      // Attempt to delete the message
      await message.delete()
      console.log(`Deleted message from ${message.author.tag} containing links: "${messageContent}"`)

      // Create and send the embed notification
      const embed = new EmbedBuilder()
        .setColor(0xff0000) // Red color for warnings
        .setTitle("🚫 Link Blocked!")
        .setDescription(`${message.author} tried to post a link. Their message has been deleted.`)
        .addFields(
          { name: "User", value: `${message.author.tag} (${message.author.id})`, inline: true },
          { name: "Channel", value: message.channel.toString(), inline: true },
          { name: "Original Message Content", value: `\`\`\`\n${messageContent}\n\`\`\`` }, // Display original content
        )
        .setTimestamp()
        .setFooter({ text: "Opal Bot | Anti-Link System" })

      await message.channel.send({ embeds: [embed] })
      return true // Link detected and action taken
    } catch (error) {
      console.error(`Error blocking link from ${message.author.tag}:`, error)
      // If bot doesn't have permissions to delete, it will throw an error.
      // We can send a warning to a moderation channel instead.
      const modChannel = message.guild.channels.cache.find(
        (channel) => channel.name === "moderation-logs" && channel.type === 0, // GUILD_TEXT
      )
      if (modChannel) {
        await modChannel.send(
          `⚠️ **WARNING:** Failed to delete a message from ${message.author} containing links due to missing permissions. Original message: \`\`\`${messageContent}\`\`\``,
        )
      } else {
        // If no mod channel, just log to console and potentially reply in public channel
        await message.channel.send(
          `I tried to delete a message from ${message.author} containing a link, but I don't have the necessary permissions. Please grant me 'Manage Messages'.`,
        )
      }
      return false // Action failed
    }
  }
  return false // No link detected
}

export { handleLinkBlocking }

import { detectViolation, issueWarning } from "../utils/moderation.js"

/**
 * Handles new messages for content moderation.
 * @param {import('discord.js').Message} message
 */
async function handleMessageCreate(message) {
  // Ignore bot messages
  if (message.author.bot) return

  // Ignore DMs for now, focus on guild messages
  if (!message.guild) return

  const messageContent = message.content

  // Check for violations using AI
  const isViolation = await detectViolation(messageContent)

  if (isViolation) {
    console.log(`Violation detected from ${message.author.globalName || message.author.username}: "${messageContent}"`)
    await issueWarning(message.member, message.channel, "Violating Discord ToS / Rude behavior detected by AI.")
  }
}

export { handleMessageCreate }

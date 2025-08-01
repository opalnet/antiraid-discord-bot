import { issueWarning } from "../utils/moderation.js"
import { detectViolation } from "../features/moderation/keyword-detector.js"
import { handleLinkBlocking } from "../features/moderation/link-blocker.js" // NEW IMPORT
import { handleKeywordResponse } from "../features/general/keyword-responses.js"
import { prefixCommands } from "../features/index.js"

const PREFIX = "o." // Define the bot's prefix

/**
 * Handles new messages for content moderation and prefix commands.
 * @param {import('discord.js').Message} message
 */
async function handleMessageCreate(message) {
  // Ignore bot messages
  if (message.author.bot) return

  // Ignore DMs for now, focus on guild messages
  if (!message.guild) return

  const messageContent = message.content

  // 1. Handle Link Blocking (Highest Priority)
  const linkBlocked = await handleLinkBlocking(message)
  if (linkBlocked) {
    return // Stop processing if a link was detected and handled
  }

  // 2. Handle Prefix Commands
  if (messageContent.startsWith(PREFIX)) {
    const args = messageContent.slice(PREFIX.length).trim().split(/ +/)
    const commandName = args.shift().toLowerCase()

    const command = prefixCommands.get(commandName)

    if (command) {
      try {
        await command(message, args) // Pass message and args to the command handler
      } catch (error) {
        console.error(`Error executing prefix command ${commandName}:`, error)
        await message.reply("There was an error trying to execute that command!")
      }
    }
    return // Stop processing if it's a prefix command
  }

  // 3. Handle Keyword-based Content Moderation
  const detectedKeyword = detectViolation(messageContent)

  if (detectedKeyword) {
    console.log(
      `Violation detected from ${message.author.globalName || message.author.username}: "${messageContent}" (Keyword: ${detectedKeyword})`,
    )
    await issueWarning(message.member, message.channel, `Violating rules: detected keyword '${detectedKeyword}'.`)
    return // Stop processing if a violation is found
  }

  // 4. Handle General Keyword Responses
  await handleKeywordResponse(message)
}

export { handleMessageCreate }

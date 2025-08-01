/**
 * A map of keywords to simple bot responses.
 * @type {Map<string, string>}
 */
const KEYWORD_RESPONSES = new Map([
  ["hello", "Hello there! How can I help you today?"],
  ["hi", "Hi! Nice to see you."],
  ["how are you", "I'm a bot, so I don't have feelings, but I'm functioning perfectly! Thanks for asking."],
  ["opal", "That's me! How can I assist you?"],
  ["thank you", "You're welcome!"],
])

/**
 * Checks if a message contains a keyword and sends a response.
 * @param {import('discord.js').Message} message
 * @returns {boolean} True if a response was sent, false otherwise.
 */
async function handleKeywordResponse(message) {
  const lowerCaseContent = message.content.toLowerCase()

  for (const [keyword, response] of KEYWORD_RESPONSES.entries()) {
    if (lowerCaseContent.includes(keyword)) {
      await message.channel.send(response)
      return true
    }
  }
  return false
}

export { handleKeywordResponse }

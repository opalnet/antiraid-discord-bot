/**
 * A simple list of keywords to detect.
 * You can expand this list significantly.
 */
const BAD_KEYWORDS = [
  "fuck",
  "shit",
  "bitch",
  "asshole",
  "cunt",
  "nigger",
  "faggot",
  "retard",
  "idiot",
  "stupid",
  "kill yourself",
  "kys",
  "nazi",
  "hitler",
  "spam", // Example for general bad behavior
  "raid", // Example for general bad behavior
]

/**
 * Detects violations based on a predefined list of keywords.
 * @param {string} messageContent
 * @returns {string | null} The detected keyword if a violation is found, otherwise null.
 */
function detectViolation(messageContent) {
  const lowerCaseContent = messageContent.toLowerCase()
  for (const keyword of BAD_KEYWORDS) {
    if (lowerCaseContent.includes(keyword)) {
      return keyword
    }
  }
  return null
}

export { detectViolation }

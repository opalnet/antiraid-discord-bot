// Central export for prefix commands
import { handleHelpCommand } from "./help/help-command.js"

// Define prefix commands
const prefixCommands = new Map([
  ["help", handleHelpCommand],
  ["ping", async (message) => message.channel.send("Pong!")],
])

export { prefixCommands }

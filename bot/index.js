import { Client, GatewayIntentBits, Collection, REST, Routes } from "discord.js"
import { readdirSync } from "fs"
import { join } from "path"
import "dotenv/config" // Load environment variables from .env file

// Event Handlers
import { handleGuildMemberAdd } from "./events/guildMemberAdd.js"
import { handleMessageCreate } from "./events/messageCreate.js" // Updated to handle prefix commands and keyword detection

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent, // Required for reading message content
  ],
})

client.commands = new Collection()
const slashCommands = []
const commandsPath = join(process.cwd(), "bot", "commands")
const commandFiles = readdirSync(commandsPath).filter((file) => file.endsWith(".js"))

for (const file of commandFiles) {
  const filePath = join(commandsPath, file)
  const command = await import(filePath)
  if ("data" in command && "execute" in command) {
    client.commands.set(command.data.name, command)
    slashCommands.push(command.data.toJSON())
  } else {
    console.warn(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`)
  }
}

client.once("ready", async () => {
  console.log(`Opal is online! Logged in as ${client.user.tag}`)

  // Register slash commands globally
  const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_BOT_TOKEN)

  try {
    console.log(`Started refreshing ${slashCommands.length} application (/) commands.`)

    const data = await rest.put(Routes.applicationCommands(client.user.id), { body: slashCommands })

    console.log(`Successfully reloaded ${data.length} application (/) commands.`)
  } catch (error) {
    console.error(error)
  }
})

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return

  const command = client.commands.get(interaction.commandName)

  if (!command) {
    console.error(`No command matching ${interaction.commandName} was found.`)
    return
  }

  try {
    await command.execute(interaction)
  } catch (error) {
    console.error(error)
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({ content: "There was an error while executing this command!", ephemeral: true })
    } else {
      await interaction.reply({ content: "There was an error while executing this command!", ephemeral: true })
    }
  }
})

// Register event listeners
client.on("guildMemberAdd", handleGuildMemberAdd)
client.on("messageCreate", handleMessageCreate) // This now handles both keyword detection and prefix commands

// Log in to Discord with your client's token
client.login(process.env.DISCORD_BOT_TOKEN)

// This file now only contains the action functions, detection logic is moved.
import { sql } from "./db.js"

const WARNING_THRESHOLD_GUILD = 3 // Warnings before kick in a single guild
const WARNING_THRESHOLD_GLOBAL = 5 // Warnings before global ban and criminal status

/**
 * Issues a warning to a user.
 * @param {import('discord.js').GuildMember} member
 * @param {import('discord.js').TextChannel} channel
 * @param {string} reason
 */
async function issueWarning(member, channel, reason) {
  const userId = member.id
  const guildId = member.guild.id
  const username = member.user.username
  const globalName = member.user.globalName || member.user.username

  try {
    // Update global user warnings
    const [user] = await sql`
      INSERT INTO users (id, username, global_name, warnings, last_warning_at)
      VALUES (${userId}, ${username}, ${globalName}, 1, NOW())
      ON CONFLICT (id) DO UPDATE SET
        username = EXCLUDED.username,
        global_name = EXCLUDED.global_name,
        warnings = users.warnings + 1,
        last_warning_at = NOW(),
        updated_at = NOW()
      RETURNING warnings;
    `

    // Update guild-specific warnings
    const [guildMember] = await sql`
      INSERT INTO guild_members (user_id, guild_id, warnings_in_guild, last_action_at)
      VALUES (${userId}, ${guildId}, 1, NOW())
      ON CONFLICT (user_id, guild_id) DO UPDATE SET
        warnings_in_guild = guild_members.warnings_in_guild + 1,
        last_action_at = NOW()
      RETURNING warnings_in_guild;
    `

    const globalWarnings = user.warnings
    const guildWarnings = guildMember.warnings_in_guild

    // DM the user
    try {
      await member.send(
        `You have received a warning in ${member.guild.name} for: ${reason}. ` +
          `You now have ${guildWarnings} warnings in this server and ${globalWarnings} global warnings.`,
      )
    } catch (dmError) {
      console.warn(`Could not DM user ${globalName}: ${dmError.message}`)
    }

    // Send in-server warning
    await channel.send(
      `${member} has been warned for: ${reason}. ` + `They now have ${guildWarnings} warnings in this server.`,
    )

    // Check for kick/ban thresholds
    if (guildWarnings >= WARNING_THRESHOLD_GUILD) {
      await kickUser(member, channel, `Exceeded ${WARNING_THRESHOLD_GUILD} warnings in this server.`)
    } else if (globalWarnings >= WARNING_THRESHOLD_GLOBAL) {
      await banUser(member, channel, `Exceeded ${WARNING_THRESHOLD_GLOBAL} global warnings.`)
    }
  } catch (error) {
    console.error(`Error issuing warning to ${globalName}:`, error)
    await channel.send(`Failed to issue warning to ${member}. An error occurred.`)
  }
}

/**
 * Kicks a user from the guild.
 * @param {import('discord.js').GuildMember} member
 * @param {import('discord.js').TextChannel} channel
 * @param {string} reason
 */
async function kickUser(member, channel, reason) {
  try {
    await member.kick(reason)
    await channel.send(`${member.user.globalName || member.user.username} has been kicked for: ${reason}`)
    console.log(`Kicked ${member.user.globalName || member.user.username} from ${member.guild.name}`)
  } catch (error) {
    console.error(`Error kicking user ${member.user.globalName || member.user.username}:`, error)
    await channel.send(`Failed to kick ${member}. An error occurred.`)
  }
}

/**
 * Bans a user from the guild and marks them as criminal globally.
 * @param {import('discord.js').GuildMember} member
 * @param {import('discord.js').TextChannel} channel
 * @param {string} reason
 */
async function banUser(member, channel, reason) {
  const userId = member.id
  const guildId = member.guild.id
  const username = member.user.username
  const globalName = member.user.globalName || member.user.username

  try {
    await member.ban({ reason })
    await channel.send(`${globalName} has been banned for: ${reason}`)
    console.log(`Banned ${globalName} from ${member.guild.name}`)

    // Mark user as criminal and banned in guild_members
    await sql`
      UPDATE users
      SET is_criminal = TRUE, updated_at = NOW()
      WHERE id = ${userId};
    `
    await sql`
      INSERT INTO guild_members (user_id, guild_id, is_banned_in_guild, last_action_at)
      VALUES (${userId}, ${guildId}, TRUE, NOW())
      ON CONFLICT (user_id, guild_id) DO UPDATE SET
        is_banned_in_guild = TRUE,
        last_action_at = NOW();
    `

    console.log(`${globalName} marked as criminal.`)
  } catch (error) {
    console.error(`Error banning user ${globalName}:`, error)
    await channel.send(`Failed to ban ${member}. An error occurred.`)
  }
}

export { issueWarning, kickUser, banUser }

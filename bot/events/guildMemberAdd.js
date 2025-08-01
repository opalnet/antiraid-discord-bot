import { sql } from "../utils/db.js"

const RAID_THRESHOLD = 10 // Number of joins
const RAID_TIME_WINDOW = 60 * 1000 // Within 60 seconds

// Store recent joins per guild
const recentJoins = new Map() // Map<guildId, Array<{ userId: string, timestamp: number }>>

/**
 * Handles new guild member additions.
 * @param {import('discord.js').GuildMember} member
 */
async function handleGuildMemberAdd(member) {
  const userId = member.id
  const guildId = member.guild.id
  const username = member.user.username
  const globalName = member.user.globalName || member.user.username

  console.log(`New member joined: ${globalName} (${userId}) in ${member.guild.name} (${guildId})`)

  try {
    // 1. Store/Update user in global users table
    await sql`
      INSERT INTO users (id, username, global_name)
      VALUES (${userId}, ${username}, ${globalName})
      ON CONFLICT (id) DO UPDATE SET
        username = EXCLUDED.username,
        global_name = EXCLUDED.global_name,
        updated_at = NOW();
    `

    // 2. Store/Update user in guild_members table
    await sql`
      INSERT INTO guild_members (user_id, guild_id)
      VALUES (${userId}, ${guildId})
      ON CONFLICT (user_id, guild_id) DO NOTHING;
    `

    // 3. Check if user is a "criminal"
    const [criminalUser] = await sql`
      SELECT is_criminal FROM users WHERE id = ${userId};
    `

    if (criminalUser && criminalUser.is_criminal) {
      const modChannel = member.guild.channels.cache.find(
        (channel) => channel.name === "moderation-logs" && channel.type === 0, // GUILD_TEXT
      )
      if (modChannel) {
        await modChannel.send(
          `🚨 **CRIMINAL ALERT!** User ${member} (${globalName}) has joined the server. ` +
            `This user has been previously marked as a criminal in other servers.`,
        )
      } else {
        console.warn(`Criminal user ${globalName} joined, but no 'moderation-logs' channel found.`)
      }
    }

    // 4. Raid Detection
    const now = Date.now()
    if (!recentJoins.has(guildId)) {
      recentJoins.set(guildId, [])
    }
    const guildJoins = recentJoins.get(guildId)

    // Add current join to the list
    guildJoins.push({ userId, timestamp: now })

    // Filter out old joins
    const filteredJoins = guildJoins.filter((join) => now - join.timestamp < RAID_TIME_WINDOW)
    recentJoins.set(guildId, filteredJoins)

    // Log join for historical raid analysis (optional, can be used for more advanced detection)
    await sql`
      INSERT INTO raid_detection_logs (guild_id, user_id, join_timestamp)
      VALUES (${guildId}, ${userId}, NOW());
    `

    if (filteredJoins.length >= RAID_THRESHOLD) {
      const modChannel = member.guild.channels.cache.find(
        (channel) => channel.name === "moderation-logs" && channel.type === 0,
      )
      if (modChannel) {
        await modChannel.send(
          `⚠️ **POTENTIAL RAID DETECTED!** ${filteredJoins.length} users joined in the last ${RAID_TIME_WINDOW / 1000} seconds.`,
        )
        // Optionally, kick new members joining during a detected raid
        // For simplicity, we'll just alert. Kicking all new members might be too aggressive.
      }
    }
  } catch (error) {
    console.error(`Error handling guildMemberAdd for ${globalName}:`, error)
  }
}

export { handleGuildMemberAdd }

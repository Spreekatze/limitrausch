import type { RequestHandler } from "express";
import { client } from "../discord/client.js";

// Diese Funktion an deine Server-Konfiguration bzw. Datenbank anbinden.
async function getManagerRoleIdsForGuild(_guildId: string): Promise<string[]> {
  // Beispiel: Manager-Rollen für diesen Server aus der
  // Datenbank oder deiner Server-Konfiguration laden.
  return [];
}

const requireServerManager: RequestHandler = async (req, res, next) => {
  const authUser = req.session.authUser;

  if (!authUser) {
    return res.status(401).json({
      message: "User is not logged in.",
    });
  }

  const guildId: unknown = req.body?.guildId;

  if (typeof guildId !== "string" || !/^\d{17,20}$/.test(guildId)) {
    return res.status(400).json({
      message: "Invalid or missing guildId.",
    });
  }

  try {
    const guild = await client.guilds.fetch(guildId);

    const member = await guild.members.fetch(authUser.id);

    const managerRoleIds = await getManagerRoleIdsForGuild(guildId);

    if (
      managerRoleIds.length === 0 ||
      !managerRoleIds.some((roleId) => member.roles.cache.has(roleId))
    ) {
      return res.status(403).json({
        message: "User is not a manager on this server.",
      });
    }

    next();
  } catch (error) {
    next(error);
  }
};

export default requireServerManager;

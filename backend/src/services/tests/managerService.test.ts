import { beforeEach, describe, expect, it, vi } from "vitest";
import { getGuildMemberInfo } from "../../discordBot/guildService.js";
import { getDiscordGuildManagerRoles } from "../../store/guildStore.js";
import { isEventManager } from "../managerService.js";

vi.mock("../../discordBot/guildService.js", () => ({
  getGuildMemberInfo: vi.fn(),
}));

vi.mock("../../store/guildStore.js", () => ({
  getDiscordGuildManagerRoles: vi.fn(),
}));

const getGuildMemberInfoMock = vi.mocked(getGuildMemberInfo);
const getDiscordGuildManagerRolesMock = vi.mocked(getDiscordGuildManagerRoles);

describe("isEventManager", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("denies users who are not members of the guild", async () => {
    getGuildMemberInfoMock.mockResolvedValue(null);

    await expect(isEventManager("user-1", "guild-1")).resolves.toBe(false);
    expect(getDiscordGuildManagerRolesMock).not.toHaveBeenCalled();
  });

  it.each(["isAdmin", "isOwner"] as const)(
    "allows a guild member who is %s",
    async (managerFlag) => {
      getGuildMemberInfoMock.mockResolvedValue({
        userId: "user-1",
        guildId: "guild-1",
        roleIds: [],
        isAdmin: managerFlag === "isAdmin",
        isOwner: managerFlag === "isOwner",
      });

      await expect(isEventManager("user-1", "guild-1")).resolves.toBe(true);
      expect(getDiscordGuildManagerRolesMock).not.toHaveBeenCalled();
    },
  );

  it("allows a member with a configured event-manager role", async () => {
    getGuildMemberInfoMock.mockResolvedValue({
      userId: "user-1",
      guildId: "guild-1",
      roleIds: ["member-role", "manager-role"],
      isAdmin: false,
      isOwner: false,
    });
    getDiscordGuildManagerRolesMock.mockResolvedValue(["manager-role"]);

    await expect(isEventManager("user-1", "guild-1")).resolves.toBe(true);
    expect(getDiscordGuildManagerRolesMock).toHaveBeenCalledWith("guild-1");
  });

  it("denies a member without a configured event-manager role", async () => {
    getGuildMemberInfoMock.mockResolvedValue({
      userId: "user-1",
      guildId: "guild-1",
      roleIds: ["member-role"],
      isAdmin: false,
      isOwner: false,
    });
    getDiscordGuildManagerRolesMock.mockResolvedValue(["manager-role"]);

    await expect(isEventManager("user-1", "guild-1")).resolves.toBe(false);
  });

  it("propagates errors when fetching guild member information fails", async () => {
    getGuildMemberInfoMock.mockRejectedValue(
      new Error("Discord API unavailable"),
    );

    await expect(isEventManager("user-1", "guild-1")).rejects.toThrow(
      "Discord API unavailable",
    );

    expect(getDiscordGuildManagerRolesMock).not.toHaveBeenCalled();
  });
});

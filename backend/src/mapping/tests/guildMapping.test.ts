import { beforeEach, describe, expect, it, vi } from "vitest";
import { isEventManager } from "../../services/managerService.js";
import { mapGuildDataToUserGuild } from "../guildMapping.js";
import type { AuthGuild } from "../../types/guildSchema.js";

vi.mock("../../services/managerService.js", () => ({
  isEventManager: vi.fn(),
}));

const isEventManagerMock = vi.mocked(isEventManager);

describe("mapGuildDataToUserGuild", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  const guild = {
    id: "guild-1",
    name: "Guild",
    icon: null,
    owner: false,
    permissions: { has: vi.fn(() => false) },
  } as unknown as AuthGuild;

  it("does not grant bot-dependent event rights when the bot is absent", async () => {
    await expect(
      mapGuildDataToUserGuild("user-1", guild, new Set()),
    ).resolves.toEqual({
      id: "guild-1",
      name: "Guild",
      icon: undefined,
      hasEventManagingRights: false,
      isAdminOrOwner: false,
      botIsPresent: false,
    });
    expect(isEventManagerMock).not.toHaveBeenCalled();
  });

  it("checks event-manager permissions only for guilds containing the bot", async () => {
    isEventManagerMock.mockResolvedValue(true);

    await expect(
      mapGuildDataToUserGuild("user-1", guild, new Set(["guild-1"])),
    ).resolves.toMatchObject({
      hasEventManagingRights: true,
      botIsPresent: true,
    });
    expect(isEventManagerMock).toHaveBeenCalledWith("user-1", "guild-1");
  });

  it("marks Discord guild owners as administrators", async () => {
    const adminGuild = {
      ...guild,
      owner: true,
    } as AuthGuild;

    await expect(
      mapGuildDataToUserGuild("user-1", adminGuild, new Set()),
    ).resolves.toMatchObject({ isAdminOrOwner: true });
  });

  it("marks users with Discord Administrator permissions as administrators", async () => {
    const adminGuild = {
      ...guild,
      owner: false,
      permissions: {
        has: vi.fn(() => true),
      },
    } as unknown as AuthGuild;

    await expect(
      mapGuildDataToUserGuild("user-1", adminGuild, new Set()),
    ).resolves.toMatchObject({
      isAdminOrOwner: true,
    });

    expect(adminGuild.permissions.has).toHaveBeenCalledWith("Administrator");
  });
});

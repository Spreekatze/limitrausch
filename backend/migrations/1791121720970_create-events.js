/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const up = (pgm) => {
  pgm.createTable("DiscordUser", {
    id: {
      type: "text",
      primaryKey: true,
    },
  });

  pgm.createTable("WebsiteUser", {
    id: {
      type: "text",
      primaryKey: true,
      references: '"DiscordUser"',
    },
    userPreferences: {
      type: "jsonb",
    },
  });

  pgm.createTable("DiscordGuild", {
    id: {
      type: "text",
      primaryKey: true,
    },
    name: {
      type: "text",
      notNull: true,
    },
    icon: {
      type: "text",
    },
    roleIDsAllowedToManageEvents: {
      type: "text[]",
    },
    roleIDsBannedFromParticipating: {
      type: "text[]",
    },
  });

  pgm.createTable(
    "DiscordTextChannel",
    {
      id: {
        type: "text",
        primaryKey: true,
      },
      name: {
        type: "text",
      },
      discordGuildId: {
        type: "text",
        notNull: true,
        references: '"DiscordGuild"',
        onDelete: "CASCADE",
      },
    },
    {
      constraints: {
        unique: ["id", "discordGuildId"],
      },
    },
  );

  pgm.createTable(
    "DiscordGuildUser",
    {
      discordUserId: {
        type: "text",
        notNull: true,
        references: '"DiscordUser"',
        onDelete: "CASCADE",
      },
      discordGuildId: {
        type: "text",
        notNull: true,
        references: '"DiscordGuild"',
        onDelete: "CASCADE",
      },
      usernameOnGuild: {
        type: "text",
        notNull: true,
      },
    },
    {
      constraints: {
        primaryKey: ["discordUserId", "discordGuildId"],
      },
    },
  );

  pgm.createTable(
    "Event",
    {
      id: {
        type: "integer",
        primaryKey: true,
        sequenceGenerated: { precedence: "ALWAYS" },
      },
      lastUpdated: {
        type: "bigint",
        notNull: true,
      },
      creatorId: {
        type: "text",
        references: '"DiscordUser"',
      },
      eventType: {
        type: "integer",
        notNull: true,
      },
      eventContent: {
        type: "text",
      },
      eventDifficulty: {
        type: "integer",
      },
      eventGoal: {
        type: "text",
      },
      leaderId: {
        type: "text",
        references: '"DiscordUser"',
      },
      title: {
        type: "text",
      },
      description: {
        type: "text",
      },
      imageUrl: {
        type: "text",
      },
      startTime: {
        type: "bigint",
        notNull: true,
      },
      endTime: {
        type: "bigint",
        notNull: true,
      },
      discordGuildId: {
        type: "text",
        references: '"DiscordGuild"',
      },
      discordTextChannelId: {
        type: "text",
      },
      discordMessageId: {
        type: "text",
        unique: true,
      },
      raidHelperId: {
        type: "text",
        unique: true,
      },
      isPublic: {
        type: "boolean",
        notNull: true,
      },
    },
    {
      constraints: {
        check: [
          '"discordTextChannelId" IS NULL OR "discordGuildId" IS NOT NULL',
          '"eventType" IN (1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 999, 998, 997)',
          '"eventDifficulty" IS NULL OR "eventDifficulty" IN (1, 2, 3, 4)',
        ],
        foreignKeys: {
          columns: ["discordTextChannelId", "discordGuildId"],
          references: '"DiscordTextChannel"("id", "discordGuildId")',
        },
      },
    },
  );

  pgm.createTable(
    "EventCoLeader",
    {
      discordUserId: {
        type: "text",
        notNull: true,
        references: '"DiscordUser"',
        onDelete: "CASCADE",
      },
      eventId: {
        type: "integer",
        notNull: true,
        references: '"Event"',
        onDelete: "CASCADE",
      },
    },
    {
      constraints: {
        primaryKey: ["discordUserId", "eventId"],
      },
    },
  );

  pgm.createTable(
    "EventSignUp",
    {
      id: {
        type: "integer",
        primaryKey: true,
        sequenceGenerated: { precedence: "ALWAYS" },
      },
      eventId: {
        type: "integer",
        references: '"Event"',
        onDelete: "CASCADE",
        notNull: true,
      },
      discordUserId: {
        type: "text",
        references: '"DiscordUser"',
      },
      raidHelperId: {
        type: "text",
        unique: true,
      },
      status: {
        type: "text",
      },
      jobFirstPrio: {
        type: "integer",
      },
      jobFlexSecondPrio: {
        type: "integer[]",
      },
    },
    {
      constraints: {
        check:
          "\"status\" IS NULL OR \"status\" IN ('Bench', 'Late', 'Tentative', 'Absence')",
      },
    },
  );
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
  pgm.dropTable("EventSignUp");
  pgm.dropTable("EventCoLeader");
  pgm.dropTable("Event");
  pgm.dropTable("DiscordGuildUser");
  pgm.dropTable("DiscordTextChannel");
  pgm.dropTable("DiscordGuild");
  pgm.dropTable("WebsiteUser");
  pgm.dropTable("DiscordUser");
};

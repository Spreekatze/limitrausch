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

  pgm.createTable("DiscordServer", {
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
    rolesAllowedToManageEvents: {
      type: "text[]",
    },
    rolesBannedFromParticipating: {
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
      discordServerId: {
        type: "text",
        notNull: true,
        references: '"DiscordServer"',
        onDelete: "CASCADE",
      },
    },
    {
      constraints: {
        unique: ["id", "discordServerId"],
      },
    },
  );

  pgm.createTable(
    "DiscordServerUser",
    {
      discordUserId: {
        type: "text",
        notNull: true,
        references: '"DiscordUser"',
        onDelete: "CASCADE",
      },
      discordServerId: {
        type: "text",
        notNull: true,
        references: '"DiscordServer"',
        onDelete: "CASCADE",
      },
      usernameOnServer: {
        type: "text",
        notNull: true,
      },
    },
    {
      constraints: {
        primaryKey: ["discordUserId", "discordServerId"],
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
      leaderId: {
        type: "text",
        references: '"DiscordUser"',
      },
      title: {
        type: "text",
        notNull: true,
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
      eventType: {
        type: "integer",
        notNull: true,
      },
      eventDifficulty: {
        type: "integer",
      },
      eventGoal: {
        type: "text",
      },
      discordServerId: {
        type: "text",
        references: '"DiscordServer"',
      },
      discordTextChannelId: {
        type: "text",
      },
      discordMessageId: {
        type: "text",
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
          '"discordTextChannelId" IS NULL OR "discordServerId" IS NOT NULL',
          '"eventType" IN (1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 999, 998, 997)',
          '"eventDifficulty" IS NULL OR "eventDifficulty" IN (1, 2, 3, 4)',
        ],
        foreignKeys: {
          columns: ["discordTextChannelId", "discordServerId"],
          references: '"DiscordTextChannel"("id", "discordServerId")',
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
  pgm.dropTable("DiscordServerUser");
  pgm.dropTable("DiscordTextChannel");
  pgm.dropTable("DiscordServer");
  pgm.dropTable("WebsiteUser");
  pgm.dropTable("DiscordUser");
};

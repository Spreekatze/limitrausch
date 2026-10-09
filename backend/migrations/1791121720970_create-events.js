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
    name: {
      type: "text",
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
    rolesAllowedToManageEvents: {
      type: "text[]",
    },
    bannedRolesFromParticipating: {
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
        type: "text",
        primaryKey: true,
      },
      lastUpdated: {
        type: "bigint",
        notNull: true,
      },
      creatorId: {
        type: "text",
        notNull: true,
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
      signUpCount: {
        type: "integer",
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
        check:
          '"discordTextChannelId" IS NULL OR "discordServerId" IS NOT NULL',
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
        type: "text",
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
      eventId: {
        type: "text",
        notNull: true,
        references: '"Event"',
        onDelete: "CASCADE",
      },
      discordUserId: {
        type: "text",
        notNull: true,
      },
      discordServerId: {
        type: "text",
        notNull: true,
      },
      status: {
        type: "text",
      },
      entryTime: {
        type: "bigint",
        notNull: true,
      },
      position: {
        type: "integer",
        notNull: true,
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
        primaryKey: ["discordUserId", "eventId"],
        foreignKeys: {
          columns: ["discordUserId", "discordServerId"],
          references: '"DiscordServerUser"("discordUserId", "discordServerId")',
          onDelete: "CASCADE",
        },
        unique: ["eventId", "discordUserId", "discordServerId"],
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
  pgm.dropTable("DiscordUser");
};

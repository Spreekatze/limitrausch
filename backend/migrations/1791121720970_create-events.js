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
      notNull: true,
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
        notNull: true,
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
      userNameOnServer: {
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
      },
      endTime: {
        type: "bigint",
      },
      eventType: {
        type: "integer",
      },
      discordServerId: {
        type: "text",
        references: '"DiscordServer"',
      },
      discordTextChannelId: {
        type: "text",
        notNull: true,
      },
      signUpCount: {
        type: "integer",
      },
      raidHelperId: {
        type: "text",
        unique: true,
      },
    },
    {
      constraints: {
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

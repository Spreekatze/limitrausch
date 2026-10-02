type eventType =
  "raid" | "casual" | "ultimate" | "archiv" | "gameEvent" | "fieldExpedition";

// This type represents a Discord user associated with an event, such as the creator or co-leaders.
type EventDataDiscordUser = {
  id: string;
  name: string;
};

// This interface represents an event. Currently in the form of the answer from Raidhelper-API.
export interface Event {
  channelId: string;
  closeTime: number;
  coLeaders: EventDataDiscordUser[];
  color: string;
  creator: EventDataDiscordUser;
  description: string;
  endTime: number;
  id: string;
  imageUrl?: string;
  lastUpdated: number;
  leaderId: string;
  leaderName: string;
  signUpCount: string;
  startTime: number;
  templateId: string; // can be removed upon own implementation of a raid event system, but is kept for now to allow for Raid Helper API integration
  title: string;
  //   eventType: eventType;    // future implementation of event types, but currently not used in the Raid Helper API response
  //   eventServerId: number;  // future implementation of event server IDs, but currently not used in the Raid Helper API response
}

// This interface represents the answer from Raidhelper API.
export interface RaidHelperEventsResponse {
  pages: number;
  eventsOverall: number;
  eventsTransmitted: number;
  currentPage: number;
  postedEvents: Event[];
}

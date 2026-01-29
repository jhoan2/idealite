import { type ComponentType } from "./constants";

export interface DiscordUser {
  id: string;
  username: string;
  global_name?: string;
  avatar?: string;
}

export interface DiscordInteraction {
  id: string;
  type: number;
  application_id: string;
  token: string;
  channel_id?: string;
  guild_id?: string;
  member?: {
    user: DiscordUser;
  };
  user?: DiscordUser;
  data?: {
    id?: string;
    name?: string;
    options?: Array<{
      name: string;
      value: string;
    }>;
    custom_id?: string;
    component_type?: number;
    values?: string[];
    // Modal submission data
    components?: Array<{
      type: number;
      components: Array<{
        type: number;
        custom_id: string;
        value: string;
      }>;
    }>;
  };
}

export interface ButtonComponent {
  type: typeof ComponentType.BUTTON;
  style: number;
  label: string;
  custom_id: string;
}

export interface SelectOption {
  label: string;
  value: string;
  description?: string;
}

export interface SelectMenuComponent {
  type: typeof ComponentType.STRING_SELECT;
  custom_id: string;
  placeholder?: string;
  options: SelectOption[];
}

export interface ActionRow {
  type: typeof ComponentType.ACTION_ROW;
  components: (ButtonComponent | SelectMenuComponent)[];
}

export interface DiscordMessagePayload {
  content?: string;
  embeds?: Array<{
    title?: string;
    description?: string;
    image?: { url: string };
    color?: number;
  }>;
  components?: ActionRow[];
  flags?: number;
}

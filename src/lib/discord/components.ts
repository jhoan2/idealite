import { ComponentType, ButtonStyle } from "./constants";
import { type ActionRow } from "./types";

/**
 * Create a row of buttons from options
 */
export function createButtonRow(
  options: Array<{ id: string; label: string }>,
  customIdPrefix: string,
): ActionRow {
  return {
    type: ComponentType.ACTION_ROW,
    components: options.slice(0, 5).map((option, index) => ({
      type: ComponentType.BUTTON,
      style: index === 0 ? ButtonStyle.PRIMARY : ButtonStyle.SECONDARY,
      label: option.label.slice(0, 80), // Discord limit
      custom_id: `${customIdPrefix}:${option.id}`,
    })),
  };
}

/**
 * Create a dropdown select menu from options
 */
export function createDropdown(
  options: Array<{ id: string; label: string; description?: string }>,
  customId: string,
  placeholder?: string,
): ActionRow {
  return {
    type: ComponentType.ACTION_ROW,
    components: [
      {
        type: ComponentType.STRING_SELECT,
        custom_id: customId,
        placeholder: placeholder ?? "Select an option",
        options: options.slice(0, 25).map((option) => ({
          label: option.label.slice(0, 100), // Discord limit
          value: option.id,
          description: option.description?.slice(0, 100),
        })),
      },
    ],
  };
}

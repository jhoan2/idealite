import { STICKER_ASSET_DESIGNER_PROMPT as STICKER_ASSET_DESIGNER_PROMPT_V1 } from "~/lib/ai/sticker-system-prompt";
import { STICKER_ASSET_DESIGNER_PROMPT_V2 } from "~/lib/ai/sticker-system-prompt-v2";

type StickerPromptVersion = "v1" | "v2";

interface StickerPromptConfig {
  experimentEnabled: string;
  version: string;
}

interface StickerPromptSelection {
  prompt: string;
  version: StickerPromptVersion;
}

export function selectStickerPrompt(
  config: StickerPromptConfig,
): StickerPromptSelection {
  const enabled = config.experimentEnabled === "true";
  const version = toVersion(config.version);

  if (!enabled) {
    return { prompt: STICKER_ASSET_DESIGNER_PROMPT_V1, version: "v1" };
  }

  if (version === "v2") {
    return { prompt: STICKER_ASSET_DESIGNER_PROMPT_V2, version: "v2" };
  }

  return { prompt: STICKER_ASSET_DESIGNER_PROMPT_V1, version: "v1" };
}

function toVersion(value: string): StickerPromptVersion {
  return value === "v2" ? "v2" : "v1";
}

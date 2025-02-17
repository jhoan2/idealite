// app/.well-known/farcaster/route.ts
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";

type FrameConfig = {
  // Manifest version. Required.
  version: "1";

  // App name. Required.
  // Max length of 32 characters.
  // Example: "Yoink!"
  name: string;

  // Default launch URL. Required.
  // Max 512 characters.
  // Example: "https://yoink.party/"
  homeUrl: string;

  // Frame application icon URL.
  // Max 512 characters.
  // Image must be 200x200px and less than 1MB.
  // Example: "https://yoink.party/img/icon.png"
  iconUrl: string;

  // Default image to show when frame is rendered in a feed.
  // Max 512 characters.
  // Image must have a 3:2 ratio.
  // Example: "https://yoink.party/framesV2/opengraph-image"
  imageUrl: string;

  // Default button title to use when frame is rendered in a feed.
  // Max 32 characters.
  // Example: "🚩 Start"
  buttonTitle: string;

  // Splash image URL.
  // Max 512 characters.
  // Image must be 200x200px and less than 1MB.
  // Example: "https://yoink.party/img/splash.png"
  splashImageUrl?: string;

  // Hex color code.
  // Example: "#eeeee4"
  splashBackgroundColor?: string;

  // URL to which clients will POST events.
  // Max 512 characters.
  // Required if the frame application uses notifications.
  // Example: "https://yoink.party/webhook"
  webhookUrl?: string;
};

type TriggerConfig =
  | {
      // Type of trigger, either cast or composer. Required.
      type: "cast";

      // Unique ID. Required. Reported to the frame.
      // Example: "yoink-score"
      id: string;

      // Handler URL. Required.
      // Example: "https://yoink.party/triggers/cast"
      url: string;

      // Name override. Optional, defaults to FrameConfig.name
      // Example: "View Yoink Score"
      name?: string;
    }
  | {
      type: "composer";
      id: string;
      url: string;
      name?: string;
    };

type FarcasterManifest = {
  // Metadata associating the domain with a Farcaster account
  accountAssociation: {
    // base64url encoded JFS header.
    // See FIP: JSON Farcaster Signatures for details on this format.
    header: string;

    // base64url encoded payload containing a single property `domain`
    payload: string;

    // base64url encoded signature bytes
    signature: string;
  };

  // Frame configuration
  frame: FrameConfig;

  // Trigger configuration
  triggers?: TriggerConfig[];
};

// Store manifests for different domains
const manifestConfigs: Record<string, FarcasterManifest> = {
  "idealite.xyz/channelFrame": {
    accountAssociation: {
      header:
        "eyJmaWQiOjIwNzAsInR5cGUiOiJjdXN0b2R5Iiwia2V5IjoiMHhFM2I4ZDQ5Mzg5MEE3MkRmNzg2NTEyMkMwY0JjZDA1NGJkMTYyNzk4In0",
      payload: "eyJkb21haW4iOiJpZGVhbGl0ZS54eXoifQ",
      signature:
        "MHgwNjNhZTM2ZThjYTgwZWIxOTNjMTQ0ZjMxNzU2YjQ0OTI2ZDQyZWE1ZjJmOTNiMjE5MTE3NDllYjE4NWVhNWZmMTMyYTRiZDAyNzA3MTdkZmZlY2VkZDUyOTZhOTQyZDdjNWM1MDkxNmQxOTk3OTQ5MTAzZjAyMzI4MGFmNTgyMDFi",
    },
    frame: {
      version: "1",
      name: "Channel Frame",
      iconUrl: "https://idealite.xyz/icon48.png",
      homeUrl: "https://idealite.xyz/channelFrame/",
      imageUrl:
        "https://gateway.pinata.cloud/ipfs/bafkreifcxtpzwappwtqn4lp2kupefzcqh4szk7kluky4abg6ywaew4chyy",
      buttonTitle: "Check this out",
      splashImageUrl:
        "https://gateway.pinata.cloud/ipfs/bafkreidlqpger2bsx56loncfxllrhx3y3msugosybbd5gjqudmirehs7xy",
      splashBackgroundColor: "#f7f7f7",
      webhookUrl:
        "https://api.neynar.com/f/app/9dca5c14-0de2-4f0c-9542-b51dea4a8474/event",
    },
    triggers: [],
  },
  "flashcards.idealite.xyz": {
    accountAssociation: {
      header:
        "eyJmaWQiOjIwNzAsInR5cGUiOiJjdXN0b2R5Iiwia2V5IjoiMHhFM2I4ZDQ5Mzg5MEE3MkRmNzg2NTEyMkMwY0JjZDA1NGJkMTYyNzk4In0",
      payload: "eyJkb21haW4iOiJmbGFzaGNhcmRzLmlkZWFsaXRlLnh5eiJ9",
      signature:
        "MHhhNzM1OTliMzVjOTk2NGQ0ZjQxZDRiMzYxZmMxMGVhMmU3YzFlYzc5OGNiZGVjMTc5YjBkMmMxNjcxNzc3MTllNDc5MmQzNzMyNjA2Zjc3NjI4NzcwNDA4MGYyNjMzYjgwYmVhZDEwZTU4NzkxMjZmZDgxYjkxNzcxM2ZlZmE5MzFj",
    },
    frame: {
      version: "1",
      name: "Q/A",
      iconUrl: "https://idealite.xyz/icon48.png",
      homeUrl: "https://flashcards.idealite.xyz",
      imageUrl:
        "https://gateway.pinata.cloud/ipfs/bafkreifwxkjn2ckhokmew27s6vwiiar2pfkwivbz4x5nhevo27nznrq454",
      buttonTitle: "Check this out",
      splashImageUrl:
        "https://gateway.pinata.cloud/ipfs/bafkreidlqpger2bsx56loncfxllrhx3y3msugosybbd5gjqudmirehs7xy",
      splashBackgroundColor: "#f7f7f7",
      webhookUrl:
        "https://api.neynar.com/f/app/9dca5c14-0de2-4f0c-9542-b51dea4a8474/event",
    },
    triggers: [],
  },
  "cloze.idealite.xyz": {
    accountAssociation: {
      header:
        "eyJmaWQiOjIwNzAsInR5cGUiOiJjdXN0b2R5Iiwia2V5IjoiMHhFM2I4ZDQ5Mzg5MEE3MkRmNzg2NTEyMkMwY0JjZDA1NGJkMTYyNzk4In0",
      payload: "eyJkb21haW4iOiJjbG96ZS5pZGVhbGl0ZS54eXoifQ",
      signature:
        "MHhlMDIyMGFhNzU1ODhkMDY1ZWM3MzUxYzliOWMxZmE4MGNkYjk5MTc3ODEzYWE2OGM0YjQ2MGQ3MzBhMDhhNzlhMjE3NjU5ODIzMWJmZWJjNDBmM2E1YjRiNGFlMzljMjdlZWMyY2VjNGYwOWI3MjJkODkyZDUzOWE0M2Y3NzMzNTFi",
    },
    frame: {
      version: "1",
      name: " ",
      iconUrl: "https://idealite.xyz/icon48.png",
      homeUrl: "https://cloze.idealite.xyz",
      imageUrl:
        "https://gateway.pinata.cloud/ipfs/bafkreihdu6kg342z66ptqpwuem2433qtfcrkchslaf5vfbf5ww27jvm574",
      buttonTitle: "Fill in the Blank",
      splashImageUrl:
        "https://gateway.pinata.cloud/ipfs/bafkreidlqpger2bsx56loncfxllrhx3y3msugosybbd5gjqudmirehs7xy",
      splashBackgroundColor: "#f7f7f7",
      webhookUrl:
        "https://api.neynar.com/f/app/9dca5c14-0de2-4f0c-9542-b51dea4a8474/event",
    },
    triggers: [],
  },
};

export async function GET(request: NextRequest) {
  // Get the host from headers
  const headersList = headers();
  const host = headersList.get("host") || "";

  // Remove port if present (for local development)
  const domain = host.split(":")[0];

  // Get the correct manifest for the domain
  const manifest = manifestConfigs[domain];

  if (!manifest) {
    return new NextResponse(JSON.stringify({ error: "Manifest not found" }), {
      status: 404,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  return new NextResponse(JSON.stringify(manifest), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
    },
  });
}

import { NextResponse } from "next/server";
import "server-only";
import { v4 as uuidv4 } from "uuid";

export async function POST(request: Request) {
  const { type, username, gameId, targetFids } = await request.json();

  try {
    const BASE_URL = process.env.NEXT_PUBLIC_DEPLOYMENT_URL;

    const gameUrl = `https://${BASE_URL}/play/friend-clash/games/${gameId}`;
    let title: string;
    let body: string;

    switch (type) {
      case "NEW_TURN":
        title = "Your Turn in Friend Clash! 🎮";
        body = `Hey @${username}! It's your turn to play.`;
        break;
      case "GAME_COMPLETED":
        title = "Friend Clash Game Completed! 🏆";
        body = "The game has ended! Check out the results.";
        break;
      default:
        throw new Error(`Invalid notification type: ${type}`);
    }

    const response = await fetch(
      "https://api.neynar.com/v2/farcaster/frame/notifications",
      {
        method: "POST",
        headers: {
          accept: "application/json",
          "content-type": "application/json",
          "x-api-key": process.env.NEYNAR_API_KEY!,
        },
        body: JSON.stringify({
          notification: {
            title,
            body,
            target_url: gameUrl,
            uuid: uuidv4(),
          },
          target_fids: targetFids,
        }),
      },
    );

    if (!response.ok) {
      const data = await response.json();
      throw new Error(`Neynar API error: ${JSON.stringify(data)}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to send notification:", error);
    return NextResponse.json({
      success: false,
      error: "Failed to send notification",
    });
  }
}

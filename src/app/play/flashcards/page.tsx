import { createQuestionAndAnswer } from "~/server/actions/card";
import FlashCards from "./flashcards";
import { auth } from "~/app/auth";
import { getUserPlayStats } from "~/server/queries/user";
import NoCardsDue from "./NoCardsDue";
import { trackEvent } from "~/lib/posthog/server";

export default async function FlashcardsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  trackEvent(session.user.fid, "questions_and_answers_page_viewed", {
    username: session.user.username,
  });

  const flashcards = await createQuestionAndAnswer();
  const userPlayStats = await getUserPlayStats(session.user.id);

  if (flashcards.length === 0) {
    return <NoCardsDue />;
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <FlashCards flashcards={flashcards} userPlayStats={userPlayStats} />
    </div>
  );
}

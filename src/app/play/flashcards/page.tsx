import { createQuestionAndAnswer } from "~/server/actions/card";
import FlashCards from "./flashcards";
import { auth } from "~/app/auth";
import { getUserPlayStats } from "~/server/queries/user";
import CardsDone from "./cardsDone";

export default async function FlashcardsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }
  const flashcards = await createQuestionAndAnswer();
  const userPlayStats = await getUserPlayStats(session.user.id);

  if (flashcards.length === 0) {
    return (
      <CardsDone
        cashEarned={0}
        pendingUpdates={[]}
        setPendingUpdates={() => {}}
        setCashEarned={() => {}}
      />
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <FlashCards flashcards={flashcards} userPlayStats={userPlayStats} />
    </div>
  );
}

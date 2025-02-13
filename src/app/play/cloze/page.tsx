import { createClozeCards } from "~/server/actions/card";
import FlashCards from "../flashcards/flashcards";
import { getUserPlayStats } from "~/server/queries/user";
import { auth } from "~/app/auth";
import NoCardsDue from "../flashcards/NoCardsDue";

export default async function ClozePage() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }
  const userPlayStats = await getUserPlayStats(session.user.id);
  const flashcards = await createClozeCards();

  if (flashcards.length === 0) {
    return <NoCardsDue />;
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <FlashCards flashcards={flashcards} userPlayStats={userPlayStats} />
    </div>
  );
}

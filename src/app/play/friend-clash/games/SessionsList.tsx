import { GameSession as GameSessionType } from "~/server/db/schema";
import Session from "./Session";

export default function SessionsList({
  sessions,
  game_type,
}: {
  sessions: GameSessionType[];
  game_type: string;
}) {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-6 text-center text-3xl font-bold">
        Your Game Sessions
      </h1>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {sessions.map((session, index) => (
          <div key={session.id} style={{ animationDelay: `${index * 100}ms` }}>
            <Session session={session} game_type={game_type} />
          </div>
        ))}
      </div>
    </div>
  );
}

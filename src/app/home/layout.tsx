import { BarChart2 } from "lucide-react";
import { currentUser } from "@clerk/nextjs/server";

export default async function HomeLayout({
  totalcards,
  cardactivity,
  totalcardsprogress,
}: {
  children: React.ReactNode;
  tagmastery: React.ReactNode;
  totalcards: React.ReactNode;
  totalcardsprogress: React.ReactNode;
  cardactivity: React.ReactNode;
}) {
  const user = await currentUser();
  const isAuthenticated = !!user;

  return (
    <div
      className={`min-h-screen bg-gray-50 p-4 pb-20 dark:bg-gray-900 md:p-6 md:pb-6`}
    >
      <h1 className="mb-6 text-2xl font-bold">Dashboard</h1>

      {isAuthenticated ? (
        // Authenticated user view
        <div className="grid grid-cols-1 gap-4">
          {/* Top row - Card Activity Stats (spans full width) */}
          {cardactivity}

          {/* Bottom row - Graphs */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* Bar Graph - Tag Mastery */}
            <div className="rounded-xl bg-white shadow-sm transition-all hover:shadow-md dark:bg-gray-800">
              <div className="h-full overflow-auto">{totalcardsprogress}</div>
            </div>

            {/* Circle Graph - Card Status Distribution */}
            <div className="rounded-xl bg-white shadow-sm transition-all hover:shadow-md dark:bg-gray-800">
              <div className="h-full overflow-auto">{totalcards}</div>
            </div>
          </div>
        </div>
      ) : (
        // Unauthenticated user view - Empty dashboard with login prompt
        <div className="grid grid-cols-1 gap-4">
          {/* Empty Charts Row */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* Empty Bar Graph */}
            <div className="flex h-[350px] flex-col items-center justify-center rounded-xl bg-white shadow-sm dark:bg-gray-800">
              <BarChart2 className="mb-4 h-16 w-16 text-gray-300 dark:text-gray-600" />
              <div className="text-center">
                <h3 className="text-lg font-medium text-gray-500 dark:text-gray-400">
                  Sign in to view your dashboard
                </h3>
                <p className="mt-2 text-sm text-gray-400 dark:text-gray-500">
                  Create flashcards and track your learning progress
                </p>
              </div>
            </div>

            {/* Empty Pie Chart */}
            <div className="hidden h-[350px] rounded-xl bg-white shadow-sm dark:bg-gray-800 md:block"></div>
          </div>
        </div>
      )}
    </div>
  );
}

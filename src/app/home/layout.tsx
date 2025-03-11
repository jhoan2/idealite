export default function HomeLayout({
  children,
  tagmastery,
  totalcards,
  cardactivity,
}: {
  children: React.ReactNode;
  tagmastery: React.ReactNode;
  totalcards: React.ReactNode;
  cardactivity: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50 p-4 dark:bg-gray-900 md:p-6">
      <h1 className="mb-6 text-2xl font-bold">Dashboard</h1>

      <div className="grid grid-cols-1 gap-4">
        {/* Top row - Card Activity Stats (spans full width) */}
        {cardactivity}

        {/* Bottom row - Graphs */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* Bar Graph - Tag Mastery */}
          <div className="rounded-xl bg-white shadow-sm transition-all hover:shadow-md dark:bg-gray-800">
            <div className="h-full overflow-auto">{tagmastery}</div>
          </div>

          {/* Circle Graph - Card Status Distribution */}
          <div className="rounded-xl bg-white shadow-sm transition-all hover:shadow-md dark:bg-gray-800">
            <div className="h-full overflow-auto">{totalcards}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

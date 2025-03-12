import { headers } from "next/headers";
export default function HomeLayout({
  tagmastery,
  totalcards,
  cardactivity,
}: {
  children: React.ReactNode;
  tagmastery: React.ReactNode;
  totalcards: React.ReactNode;
  cardactivity: React.ReactNode;
}) {
  const headersList = headers();
  const userAgent = headersList.get("user-agent");
  const isMobile = userAgent?.toLowerCase().includes("mobile");

  return (
    <div
      className={`min-h-screen bg-gray-50 p-4 dark:bg-gray-900 md:p-6 ${
        isMobile ? "pb-20" : ""
      }`}
    >
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

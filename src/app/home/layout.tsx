export default function HomeLayout({
  children,
  totalcards,
  cardactivity,
  totalcardsprogress,
}: {
  children: React.ReactNode;
  totalcards: React.ReactNode;
  totalcardsprogress: React.ReactNode;
  cardactivity: React.ReactNode;
}) {
  void totalcards;
  void cardactivity;
  void totalcardsprogress;

  return (
    <div className="min-h-screen bg-gray-50 p-4 pb-20 dark:bg-gray-900 md:p-6 md:pb-6">
      {/* Temporarily disabled dashboard slot rendering while /home is under construction. */}
      {children}
    </div>
  );
}

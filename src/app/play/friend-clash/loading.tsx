export default function Loading() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <div className="relative">
        <img
          src="/idealite-loading-logo.gif"
          alt="Loading..."
          width={200} // Adjust size as needed
          height={200}
          className="duration-1000 animate-in fade-in"
        />
      </div>
      <p className="mt-4 animate-pulse text-lg text-muted-foreground">
        Loading...
      </p>
    </div>
  );
}

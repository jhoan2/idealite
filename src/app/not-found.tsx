export default function NotFound() {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-background text-foreground">
      <h1 className="text-8xl font-bold">404</h1>
      <p className="mt-4 text-lg">Ooops! Nothing to see here.</p>
      <a
        href="/home"
        className="mt-4 rounded-full border border-foreground px-4 py-2 hover:bg-foreground hover:text-background"
      >
        Take me home
      </a>
    </div>
  );
}

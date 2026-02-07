import { AllPagesTable } from "../_components/AllPagesTable";

export default function AllPagesPage() {
  return (
    <div className="flex h-full w-full flex-col p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">All Notes</h1>
        <p className="text-muted-foreground">
          Browse and manage your local library.
        </p>
      </div>
      <AllPagesTable />
    </div>
  );
}

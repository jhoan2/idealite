interface LociSceneEditPageProps {
  params: {
    id: string;
  };
}

export default function LociSceneEditPage({ params }: LociSceneEditPageProps) {
  return (
    <div className="container mx-auto max-w-5xl space-y-6 px-4 py-8">
      <div>
        <h1 className="text-3xl font-bold">Loci Scene Edit</h1>
        <p className="mt-2 text-sm text-muted-foreground">Scene ID: {params.id}</p>
      </div>

      <div className="rounded-md border p-6">
        <p className="text-sm text-muted-foreground">
          Placeholder: edit an existing scene.
        </p>
      </div>
    </div>
  );
}

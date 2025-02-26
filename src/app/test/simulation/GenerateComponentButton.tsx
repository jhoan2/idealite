"use client";
export default function GenerateComponentButton() {
  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6">
        <button
          onClick={async () => {
            try {
              const response = await fetch("/api/generate-live-component", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  subject: "permutations and combinations",
                }),
              });

              if (!response.ok) {
                throw new Error("Failed to generate component");
              }

              const data = await response.json();
              if (data.success) {
                // Handle successful response
                console.log("Component generated:", data);
              } else {
                throw new Error(data.error || "Failed to generate component");
              }
            } catch (error) {
              console.error("Error generating component:", error);
            }
          }}
          className="rounded-md bg-primary px-4 py-2 text-white hover:bg-primary/90"
        >
          Generate New Component
        </button>
      </div>
    </div>
  );
}

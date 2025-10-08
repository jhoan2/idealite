// src/app/waitlist/[[...waitlist]]/page.tsx
import { Waitlist } from "@clerk/nextjs";

export default function WaitlistPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <Waitlist />
    </div>
  );
}

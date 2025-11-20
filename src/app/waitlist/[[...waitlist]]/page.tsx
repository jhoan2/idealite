// src/app/waitlist/[[...waitlist]]/page.tsx
import { Waitlist } from "@clerk/nextjs";
import { GoogleTag } from "~/components/GoogleTag";

export default function WaitlistPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <GoogleTag />
      <Waitlist />
    </div>
  );
}

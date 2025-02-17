"use client";

import { signOut } from "next-auth/react";
import { Button } from "~/components/ui/button";

export default function SignOut() {
  const handleSignOut = async () => {
    await signOut();
    window.location.reload();
  };

  return (
    <div className="flex justify-end">
      <Button onClick={handleSignOut}>SignOut</Button>
    </div>
  );
}

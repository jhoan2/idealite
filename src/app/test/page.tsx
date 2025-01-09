"use client";

import { Button } from "~/components/ui/button";

export default function TestPage() {
  const handleClick = async () => {
    try {
      const response = await fetch("/api/neynar-webhook", {
        method: "GET",
      });
      const data = await response.json();
      console.log(data);
    } catch (error) {
      console.error("Error:", error);
    }
  };
  return (
    <div>
      <Button onClick={handleClick}>Test</Button>
    </div>
  );
}

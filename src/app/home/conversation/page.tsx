"use client";

import React, { Suspense } from "react";
import CastConversation from "./(CastConversation)/CastConversation";

export default function Conversation() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CastConversation />
    </Suspense>
  );
}

"use client";

import { NeynarContextProvider, Theme } from "@neynar/react";
import "@neynar/react/dist/style.css";
import { signIn, signOut } from "next-auth/react";

export default function NeynarProvider({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <NeynarContextProvider
      settings={{
        clientId: process.env.NEXT_PUBLIC_NEYNAR_CLIENT_ID || "",
        defaultTheme: Theme.Light,
        eventsCallbacks: {
          onAuthSuccess: ({ user }) => {
            signIn("neynar", {
              redirect: true,
              redirectTo: "/home",
              custody_address: user.custody_address,
              fid: user.fid,
              pfp_url: user.pfp_url,
              username: user.username,
              display_name: user.display_name,
              bio: user.profile?.bio?.text,
            });
          },
          onSignout: () => {
            signOut();
          },
        },
      }}
    >
      {children}
    </NeynarContextProvider>
  );
}

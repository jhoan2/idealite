"use client";

import { Button } from "~/components/ui/button";
import { useCallback, useState } from "react";
import sdk from "@farcaster/frame-sdk";
import { signIn, getCsrfToken } from "next-auth/react";
import { Loader2 } from "lucide-react";
import * as Sentry from "@sentry/nextjs";

export default function WarpcastLogin() {
  const [signingIn, setSigningIn] = useState(false);
  const getNonce = useCallback(async () => {
    const nonce = await getCsrfToken();
    if (!nonce) throw new Error("Unable to generate nonce");
    return nonce;
  }, []);

  const handleSignIn = useCallback(async () => {
    try {
      setSigningIn(true);
      const nonce = await getNonce();
      const result = await sdk.actions.signIn({ nonce });
      const signInResult = await signIn("channelFrame", {
        message: result.message,
        signature: result.signature,
        redirect: false,
      });

      if (signInResult?.error) {
        Sentry.captureException(signInResult.error);
        console.log("Sign in cancelled or failed:", signInResult.error);
        return;
      }
      window.location.reload();
    } finally {
      setSigningIn(false);
    }
  }, [getNonce]);

  return (
    <div className="text-center">
      <main className="flex flex-col items-center px-6 pt-12">
        <div className="relative mb-8 flex aspect-square w-full max-w-md items-center justify-center">
          <img
            src="/icon256.png"
            alt="Mathematical rocket illustration"
            className="h-64 w-64 object-contain"
          />
        </div>

        <div className="mb-8 space-y-4 text-center">
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
            Friend Clash
          </h1>
          <p className="mx-auto max-w-md text-lg text-muted-foreground">
            Challenge your friends to a knowledge battle!
          </p>
        </div>

        <div className="w-full max-w-md space-y-4">
          <Button
            onClick={handleSignIn}
            disabled={signingIn}
            size="lg"
            className="w-full rounded-full bg-primary py-4 text-primary-foreground"
          >
            {signingIn ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing in...
              </>
            ) : (
              "Sign in with Farcaster"
            )}
          </Button>
        </div>
      </main>
    </div>
  );
}

"use client";

import Image from "next/image";
import { Button } from "~/components/ui/button";
import { useCallback, useState } from "react";
import sdk from "@farcaster/frame-sdk";
import { signIn, getCsrfToken } from "next-auth/react";
import { Loader2 } from "lucide-react";
import * as Sentry from "@sentry/nextjs";

export default function Welcome({
  goToNextStep,
}: {
  goToNextStep: () => void;
}) {
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

      goToNextStep();
    } finally {
      setSigningIn(false);
    }
  }, [getNonce]);
  return (
    <div className="text-center">
      {/* Main Content */}
      <main className="flex flex-col items-center px-6 pt-12">
        {/* Hero Image */}
        <div className="relative mb-8 flex aspect-square w-full max-w-md items-center justify-center">
          <Image
            src="/icon256.png"
            alt="Mathematical rocket illustration"
            className="object-contain"
            priority
            width={256}
            height={268}
          />
        </div>

        {/* Text Content */}
        <div className="mb-8 space-y-4 text-center">
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
            An MMO Learning Game
          </h1>
          <p className="mx-auto max-w-md text-lg text-muted-foreground">
            The MMO where knowledge is your superpower.
          </p>
        </div>

        {/* Buttons */}
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

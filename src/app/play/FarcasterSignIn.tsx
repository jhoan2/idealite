"use client";

import Image from "next/image";
import { Button } from "~/components/ui/button";
import { useCallback, useState, useEffect } from "react";
import sdk from "@farcaster/frame-sdk";
import { signIn, getCsrfToken } from "next-auth/react";
import { Loader2, CheckCircle } from "lucide-react";
import * as Sentry from "@sentry/nextjs";
import { useRouter } from "next/navigation";

export default function FarcasterSignIn() {
  const [signingIn, setSigningIn] = useState(false);
  const [signInSuccess, setSignInSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const router = useRouter();

  const getNonce = useCallback(async () => {
    const nonce = await getCsrfToken();
    if (!nonce) throw new Error("Unable to generate nonce");
    return nonce;
  }, []);

  const handleSignIn = useCallback(async () => {
    setErrorMessage(null);
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
        setErrorMessage("Sign in failed. Please try again.");
        console.log("Sign in cancelled or failed:", signInResult.error);
        return;
      }

      // Set sign-in success
      setSignInSuccess(true);
    } catch (error) {
      console.error("Error during sign in:", error);
      setErrorMessage("An unexpected error occurred. Please try again.");
      Sentry.captureException(error);
    } finally {
      setSigningIn(false);
    }
  }, [getNonce]);

  // Handle redirection after successful sign-in
  useEffect(() => {
    if (signInSuccess) {
      // Redirect after a brief delay to allow user to see success message
      const redirectTimeout = setTimeout(() => {
        router.push("/workspace"); // Replace with your desired redirect path
      }, 2000); // 2 seconds delay

      return () => clearTimeout(redirectTimeout);
    }
  }, [signInSuccess, router]);

  return (
    <div className="pb-28 pt-4 text-center">
      {/* Main Content */}
      <main className="flex flex-col items-center px-6">
        {/* Hero Image */}
        <div className="relative mb-6 flex aspect-square w-full max-w-md items-center justify-center">
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
        <div className="mb-6 space-y-3 text-center">
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
            An MMO Learning Game
          </h1>
          <p className="mx-auto max-w-md text-lg text-muted-foreground">
            The MMO where knowledge is your superpower.
          </p>
        </div>

        {/* Buttons */}
        <div className="w-full max-w-md space-y-4">
          {!signInSuccess ? (
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
          ) : (
            <div className="flex flex-col items-center space-y-3">
              <div className="flex items-center rounded-full bg-green-100 px-4 py-2 text-green-800 dark:bg-green-900 dark:text-green-100">
                <CheckCircle className="mr-2 h-5 w-5" />
                <span>Successfully signed in!</span>
              </div>
              <div className="flex items-center text-sm text-muted-foreground">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                <span>Redirecting to workspace...</span>
              </div>
            </div>
          )}

          {/* Error message */}
          {errorMessage && (
            <div className="mt-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {errorMessage}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

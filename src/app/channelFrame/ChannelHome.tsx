"use client";

import { useEffect, useCallback, useState } from "react";
import sdk, { type FrameContext } from "@farcaster/frame-sdk";
import { signIn, signOut, getCsrfToken } from "next-auth/react";
import { useSession } from "next-auth/react";
import { SignInResult } from "@farcaster/frame-core/dist/actions/signIn";
import { Button } from "~/components/ui/button";

export default function ChannelHome() {
  const [isSDKLoaded, setIsSDKLoaded] = useState(false);

  useEffect(() => {
    const load = async () => {
      sdk.actions.ready();
    };
    if (sdk && !isSDKLoaded) {
      setIsSDKLoaded(true);
      load();
    }
  }, [isSDKLoaded]);

  if (!isSDKLoaded) {
    return <div>Loading...</div>;
  }

  return (
    <div className="mx-auto w-[300px] px-2 py-4">
      <h1 className="mb-4 text-center text-2xl font-bold">Frames v2 Demo</h1>
      <div className="mb-4">
        <div className="my-2 rounded-lg bg-gray-100 p-2 dark:bg-gray-800">
          <pre className="overflow-x- max-w-[260px] whitespace-pre-wrap break-words font-mono text-xs">
            sdk.actions.signIn
          </pre>
        </div>
        <SignIn />
      </div>
    </div>
  );
}

function SignIn() {
  const [signingIn, setSigningIn] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [signInResult, setSignInResult] = useState<SignInResult>();
  const { data: session, status } = useSession();
  const [nonce, setNonce] = useState<string | null>(null);

  const getNonce = useCallback(async () => {
    const nonce = await getCsrfToken();
    if (!nonce) throw new Error("Unable to generate nonce");
    setNonce(nonce);
    return nonce;
  }, []);

  const handleSignIn = useCallback(async () => {
    try {
      setSigningIn(true);
      const nonce = await getNonce();
      const result = await sdk.actions.signIn({ nonce });
      setSignInResult(result);
      await signIn("channelFrame", {
        message: result.message,
        signature: result.signature,
        redirect: false,
      });
    } finally {
      setSigningIn(false);
    }
  }, [getNonce]);

  const handleSignOut = useCallback(async () => {
    try {
      setSigningOut(true);
      await signOut({ redirect: false });
      setSignInResult(undefined);
    } finally {
      setSigningOut(false);
    }
  }, []);
  return (
    <>
      {status !== "authenticated" && (
        <Button onClick={handleSignIn} disabled={signingIn}>
          Sign In with Farcaster
        </Button>
      )}
      {status === "authenticated" && (
        <Button onClick={handleSignOut} disabled={signingOut}>
          Sign out
        </Button>
      )}
      {session && (
        <div className="my-2 overflow-x-scroll rounded-lg bg-gray-100 p-2 font-mono text-xs">
          <div className="mb-1 font-semibold text-gray-500">Session</div>
          <div className="whitespace-pre text-black">
            {JSON.stringify(session, null, 2)}
          </div>
        </div>
      )}
      {signInResult && !signingIn && (
        <div className="my-2 overflow-x-scroll rounded-lg bg-gray-100 p-2 font-mono text-xs">
          <div className="mb-1 font-semibold text-black">SIWF Result</div>
          <div className="whitespace-pre text-black">
            {JSON.stringify(signInResult, null, 2)}
          </div>
          <div className="whitespace-pre text-black">
            {JSON.stringify(nonce, null, 2)}
          </div>
        </div>
      )}
    </>
  );
}

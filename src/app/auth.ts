import NextAuth from "next-auth";
import credentialsProvider from "next-auth/providers/credentials";
import { findUserByFid, createUser } from "~/server/queries/user";
import { createAppClient, viemConnector } from "@farcaster/auth-client";

declare module "next-auth" {
  interface Session {
    user?: {
      id: string;
      fid: number;
      custody_address: string;
      username: string;
      display_name: string;
      pfp_url: string;
      bio: string;
    };
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    credentialsProvider({
      id: "neynar",
      credentials: {
        signer_uuid: { type: "text" },
        fid: { type: "number" },
        custody_address: { type: "text" },
        username: { type: "text" },
        display_name: { type: "text" },
        pfp_url: { type: "text" },
        bio: { type: "text" },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.signer_uuid) {
            throw new Error("Signer UUID is undefined");
          }

          const user = await findUserByFid(credentials.fid as number);
          if (!user) {
            const url = `https://api.neynar.com/v2/farcaster/signer?signer_uuid=${credentials.signer_uuid}`;
            const options = {
              method: "GET",
              headers: {
                accept: "application/json",
                api_key: process.env.NEYNAR_API_KEY || "NEYNAR_API_DOCS",
              },
            };

            const response = await fetch(url, options);
            const json = await response.json();

            if (json && json.status === "approved") {
              // Signer is valid, create a new user
              const newUser = await createUser({
                fid: credentials.fid as number,
                custody_address: credentials.custody_address as string,
                username: credentials.username as string,
                display_name: credentials.display_name as string,
                pfp_url: credentials.pfp_url as string,
                bio: credentials.bio as string,
              });
              return newUser;
            } else {
              throw new Error("Invalid signer");
            }
          } else {
            return user;
          }
        } catch (e) {
          console.error("error:", e);
          return null;
        }
      },
    }),
    credentialsProvider({
      id: "channelFrame",
      name: "Sign in with Farcaster",
      credentials: {
        message: {
          label: "Message",
          type: "text",
          placeholder: "0x0",
        },
        signature: {
          label: "Signature",
          type: "text",
          placeholder: "0x0",
        },
        // In a production app with a server, these should be fetched from
        // your Farcaster data indexer rather than have them accepted as part
        // of credentials.
        name: {
          label: "Name",
          type: "text",
          placeholder: "0x0",
        },
        pfp: {
          label: "Pfp",
          type: "text",
          placeholder: "0x0",
        },
      },
      async authorize(credentials, req) {
        const request = req as Request;
        const formData = await request.formData();

        // Get the JSON string that's being used as the key
        const jsonKey = Array.from(formData.keys())[0];

        // Parse the JSON string to get the actual data
        const parsedData = JSON.parse(jsonKey as string);
        const csrfToken = parsedData.csrfToken;

        console.log("Parsed CSRF Token:", csrfToken);
        const appClient = createAppClient({
          ethereum: viemConnector(),
        });
        const verifyResponse = await appClient.verifySignInMessage({
          message: credentials?.message as string,
          signature: credentials?.signature as `0x${string}`,
          domain:
            process.env.NEXTAUTH_URL ??
            "9d65-2601-646-8900-8b60-bc28-307b-dae5-950f.ngrok-free.app",
          nonce: csrfToken as string,
        });
        console.log("verifyResponse", verifyResponse);
        const { success, fid } = verifyResponse;
        console.log("success", success);
        console.log("fid", fid);
        if (!success) {
          return null;
        }
        return {
          id: fid.toString(),
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.user = user;
      }
      return token;
    },
    async session({ session, token }) {
      session.user = token.user as any;
      return session;
    },
  },
});

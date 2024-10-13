import NextAuth from "next-auth"
import credentialsProvider from 'next-auth/providers/credentials'
import { findUserByFid, createUser } from "~/server/userQueries"

export const { handlers, signIn, signOut, auth } = NextAuth({
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    credentialsProvider({
      async authorize(credentials) {
        try {
          if (!credentials?.signer_uuid) {
            throw new Error('Signer UUID is undefined')
          }
  
          const user = await findUserByFid(credentials.fid as number);
          if (!user) {
            const url = `https://api.neynar.com/v2/farcaster/signer?signer_uuid=${credentials.signer_uuid}`;
            const options = {
              method: 'GET',
              headers: {
                accept: 'application/json',
                api_key: process.env.NEYNAR_API_KEY || 'NEYNAR_API_DOCS'
              }
            };
  
            const response = await fetch(url, options);
            const json = await response.json();
  
            if (json && json.status === 'approved') {
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
              throw new Error('Invalid signer');
            }
  
          } else {
            return user;
          }
  
  
        } catch (e) {
          console.error('error:', e);
          return null
        }
      }
    })
  ],
  session: {
    strategy: 'jwt'
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
  }
})
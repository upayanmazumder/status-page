import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import jwt from "jsonwebtoken";

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, account, user }) {
      if (account && user) {
        token.sub = account.providerAccountId;
        token.email = user.email;
        token.name = user.name;

        token.accessToken = jwt.sign(
          { sub: token.sub, email: user.email },
          process.env.NEXTAUTH_SECRET,
          { expiresIn: "1h" }
        );
      }

      return token;
    },

    async session({ session, token }) {
      session.accessToken = token.accessToken;
      session.user.sub = token.sub;
      return session;
    },
  },
});

export { handler as GET, handler as POST };

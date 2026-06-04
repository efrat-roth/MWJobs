import { type NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { env } from '../config/environment';

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: env.getGoogleFrontendConfig().clientId || '',
      clientSecret: env.getGoogleFrontendConfig().clientSecret || ''
    })
  ],
  callbacks: {
    async signIn({ user }) {
      const adminEmail = env.getAdminEmail();
      if (!adminEmail) return false;
      return user.email === adminEmail;
    },
    async session({ session }) {
      // Mark admin
      if (session?.user?.email === env.getAdminEmail()) {
        (session as any).isAdmin = true;
      }
      return session;
    }
  },
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/admin'
  }
};

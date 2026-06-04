import type { AppProps } from 'next/app';
import { SessionProvider } from 'next-auth/react';
import { useRouter } from 'next/router';
import '../styles/main.css';
import '../styles/admin.css';

export default function App({ Component, pageProps: { session, ...pageProps } }: AppProps) {
  const router = useRouter();
  const isAdminPage = router.pathname.startsWith('/admin');

  return (
    <SessionProvider session={session}>
      <div className={isAdminPage ? 'admin-theme' : 'main-theme'}>
        <Component {...pageProps} />
      </div>
    </SessionProvider>
  );
}

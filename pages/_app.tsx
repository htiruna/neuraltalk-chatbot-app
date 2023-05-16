import { Toaster } from 'react-hot-toast';
import { QueryClient, QueryClientProvider } from 'react-query';

import type { AppProps } from 'next/app';
import { Inter } from 'next/font/google';
import Router from 'next/router';

import { UserProvider } from '@auth0/nextjs-auth0/client';
import NProgress from 'nprogress';

import 'nprogress/nprogress.css';
import '@/styles/globals.css';

const inter = Inter({ subsets: ['latin'] });

NProgress.configure({ showSpinner: false }); // this will remove the default spinner

Router.events.on('routeChangeStart', () => NProgress.start());
Router.events.on('routeChangeComplete', () => NProgress.done());
Router.events.on('routeChangeError', () => NProgress.done());

function App({ Component, pageProps }: AppProps<{}>) {
  const queryClient = new QueryClient();

  return (
    <div className={inter.className}>
      <Toaster />
      <QueryClientProvider client={queryClient}>
        <UserProvider>
          <Component {...pageProps} />
        </UserProvider>
      </QueryClientProvider>
    </div>
  );
}

export default App;

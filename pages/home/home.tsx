import Link from 'next/link';

import Loading from '@/components/Loading';

import { withPageAuthRequired } from '@auth0/nextjs-auth0/client';

const Home = ({ user }: any) => {
  return (
    <div className="flex h-screen w-screen flex-col text-sm text-white">
      <p>
        Welcome {user.name}! <Link href="/api/auth/logout">Logout</Link>
      </p>
    </div>
  );
};

export default withPageAuthRequired(Home, {
  onRedirecting: () => <Loading />,
  onError: (error) => <div>{error.message}</div>,
});

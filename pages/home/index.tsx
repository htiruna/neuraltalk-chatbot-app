// @ts-nocheck
import React, { useEffect, useState } from 'react';

import Link from 'next/link';

import { getChatbotsForUser } from '@/utils/data/supabase';

import Loading from '@/components/Loading';

import { withPageAuthRequired } from '@auth0/nextjs-auth0/client';

const Home = ({ user }: any) => {
  const [chatbots, setChatbots] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchChatbots = async () => {
      const result = await getChatbotsForUser(user.sub, user.token);
      if (result.error) {
        console.error('Error fetching chatbots:', result.error);
      } else {
        console.log('Chatbots:', result);
        setChatbots(result);
      }
      setLoading(false);
    };
    fetchChatbots();
  }, [user]);

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="flex h-screen w-screen flex-col text-sm text-white">
      <p>
        Welcome {user.name}! <Link href="/api/auth/logout">Logout</Link>
      </p>
      <h2>My Chatbots:</h2>
      <ul>
        {chatbots.map((chatbot) => (
          <li key={chatbot.id}>
            <h3>
              <Link href={`/chatbot/${chatbot.namespace}`} target="_blank">
                {chatbot.name}
              </Link>
            </h3>
            <p>{chatbot.description}</p>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default withPageAuthRequired(Home, {
  onRedirecting: () => <Loading />,
  onError: (error) => <div>{error.message}</div>,
});

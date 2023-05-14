import { NextApiRequest, NextApiResponse } from 'next';

import { insertUser } from '@/utils/data/supabase';

import { handleAuth, handleCallback } from '@auth0/nextjs-auth0';

const afterCallback = async (
  _: NextApiRequest,
  __: NextApiResponse,
  session: any,
) => {
  const {
    user: { sub: userId, email },
  } = session;

  // Upsert user in Supabase after successful Auth0 authentication
  const result = await insertUser({
    userId,
    email,
  });

  if (result?.error) {
    console.error('Error inserting user:', result.error);
    throw new Error(result.error.message);
  }

  return session;
};

export default handleAuth({
  async callback(req, res) {
    try {
      await handleCallback(req, res, { afterCallback });
    } catch (error: any) {
      res.status(error.status || 500).end(error.message);
    }
  },
});

import { NextApiRequest, NextApiResponse } from 'next';

import { insertUser } from '@/utils/data/supabase';

import { handleAuth, handleCallback } from '@auth0/nextjs-auth0';
import jwt from 'jsonwebtoken';

const afterCallback = async (
  req: NextApiRequest,
  res: NextApiResponse,
  session: any,
) => {
  if (!process.env.SUPABASE_JWT_SECRET) {
    throw new Error('Missing SUPABASE_JWT_SECRET');
  }

  const {
    user: { sub: userId, email },
  } = session;

  const payload = {
    userId,
    exp: Math.floor(Date.now() / 1000) + 60 * 60,
  };

  session.user.accessToken = jwt.sign(
    payload,
    process.env.SUPABASE_JWT_SECRET ?? '',
  );

  // Upsert user in Supabase after successful Auth0 authentication
  const result = await insertUser(
    {
      userId,
      email,
    },
    session.user.accessToken,
  );

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

import { SupabaseClient, createClient } from '@supabase/supabase-js';

interface Options {
  global?: {
    headers: {
      Authorization: string;
    };
  };
}

interface UserData {
  userId: string;
  email: string;
}

export const supabaseClient = (access_token?: string): SupabaseClient => {
  const options: Options = {};

  if (access_token) {
    options.global = {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    };
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string,
    options,
  );

  return supabase;
};

export const insertUser = async (userData: UserData, accessToken: string) => {
  const supabase = supabaseClient(accessToken);
  const { userId: auth0_id, email } = userData;

  // Check if user already exists
  const { data: existingUser, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .limit(1);

  if (error) {
    console.error('Error checking if user already exists:', error);
    return { error };
  }

  if (existingUser && existingUser.length > 0) {
    return existingUser[0];
  }

  // User does not exist, insert a new one
  const { data: newUser, error: insertError } = await supabase
    .from('users')
    .insert([{ auth0_id, email }])
    .single();

  if (insertError) {
    console.error('Error inserting new user:', insertError);
    return { error };
  }

  return newUser;
};

export const getChatbotsForUser = async (
  auth0_id: string,
  accessToken: string,
) => {
  const supabase = supabaseClient(accessToken);

  // Get user role and id
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('role, id')
    .eq('auth0_id', auth0_id)
    .single();

  if (userError) {
    console.error('Error fetching user role:', userError);
    return { error: userError };
  }

  // If user is admin, return all chatbots
  if (user?.role === 'admin') {
    const { data: chatbots, error: chatbotsError } = await supabase
      .from('chatbots')
      .select('*');

    if (chatbotsError) {
      console.error('Error fetching all chatbots:', chatbotsError);
      return { error: chatbotsError };
    }

    return chatbots;
  }

  // If user is not admin, return only their chatbots
  const { data: chatbots, error: chatbotsError } = await supabase
    .from('user_chatbots')
    .select('chatbots(*)')
    .eq('user_id', user.id);

  if (chatbotsError) {
    console.error('Error fetching user chatbots:', chatbotsError);
    return { error: chatbotsError };
  }

  return chatbots.map((chatbot) => chatbot.chatbots);
};

export const getChatbotById = async (id: string, accessToken: string) => {
  const supabase = supabaseClient(accessToken);

  const { data: chatbot, error } = await supabase
    .from('chatbots')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching chatbot:', error);
    return { error };
  }

  return chatbot;
};

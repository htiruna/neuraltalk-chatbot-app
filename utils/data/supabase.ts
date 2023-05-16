import { Message } from '@/types/chat';

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

export const supabaseClient = (): SupabaseClient => {
  const options: Options = {};

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string,
    options,
  );

  return supabase;
};

export const insertUser = async (userData: UserData) => {
  const supabase = supabaseClient();
  const { userId, email } = userData;

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
    .insert([{ id: userId, email }])
    .single();

  if (insertError) {
    console.error('Error inserting new user:', insertError);
    return { error };
  }

  return newUser;
};

export const getChatbotsForUser = async (userId: string) => {
  const supabase = supabaseClient();

  // Get user role and id
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('role, id')
    .eq('id', userId)
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

// TODO: check that user can access this chatbot
export const getChatbotById = async (id: string, userId: string) => {
  const supabase = supabaseClient();

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

export const upsertConversationAndMessages = async (
  conversationId: string,
  userId: string,
  chatbotId: string,
  messages: Message[],
) => {
  const supabase = supabaseClient();

  // Check if conversation already exists
  const { data: existingConversation, error: conversationError } =
    await supabase.from('conversations').select('*').eq('id', conversationId);

  if (conversationError) {
    console.error(
      'Error checking if conversation already exists:',
      conversationError,
    );
    return { error: conversationError };
  }

  // If conversation does not exist, insert a new one
  if (existingConversation?.length === 0) {
    const { data: newConversation, error: newConversationError } =
      await supabase
        .from('conversations')
        .insert([
          {
            id: conversationId,
            user_id: userId,
            chatbot_id: chatbotId,
          },
        ])
        .single();

    if (newConversationError) {
      console.error('Error inserting new conversation:', newConversationError);
      return { error: newConversationError };
    }
  }

  // Get the count of messages for the conversation from the database
  const { data: messagesCountData, error: messagesCountError } = await supabase
    .from('messages')
    .select('id', { count: 'exact' })
    .eq('conversation_id', conversationId);

  if (messagesCountError) {
    console.error('Error fetching messages count:', messagesCountError);
    return { error: messagesCountError };
  }

  const messagesCount = messagesCountData?.length ?? 0;

  // Check if there's a new message to be saved
  if (messages.length > messagesCount) {
    // Get the new messages
    const newMessages = messages.slice(messagesCount);

    // Prepare messages to be inserted
    const messagesToInsert = newMessages.map((message) => ({
      conversation_id: conversationId,
      content: message.content,
      role: message.role,
    }));

    // Insert messages
    const { data: insertedMessages, error: newMessagesError } = await supabase
      .from('messages')
      .insert(messagesToInsert);

    if (newMessagesError) {
      console.error('Error inserting new messages:', newMessagesError);
      return { error: newMessagesError };
    }

    return { messages: insertedMessages };
  }

  // No new message to be saved
  return { messages: null };
};

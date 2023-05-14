import { Conversation } from '@/types/chat';

export const updateConversation = (
  updatedConversation: Conversation,
  allConversations: Conversation[],
  namespace: string,
) => {
  const updatedConversations = allConversations.map((c) => {
    if (c.id === updatedConversation.id) {
      return updatedConversation;
    }

    return c;
  });

  console.log(
    'updatedConversations',
    updatedConversations,
    allConversations,
    namespace,
  );

  saveConversation(updatedConversation, namespace);
  saveConversations(updatedConversations, namespace);

  return {
    single: updatedConversation,
    all: updatedConversations,
  };
};

export const saveConversation = (
  conversation: Conversation,
  namespace: string,
) => {
  localStorage.setItem(
    `selectedConversation:${namespace}`,
    JSON.stringify(conversation),
  );
};

export const saveConversations = (
  conversations: Conversation[],
  namespace: string,
) => {
  localStorage.setItem(
    `conversationHistory:${namespace}`,
    JSON.stringify(conversations),
  );
};

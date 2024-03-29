import { useEffect, useRef, useState } from 'react';

import Head from 'next/head';
import { useRouter } from 'next/router';

import { useCreateReducer } from '@/hooks/useCreateReducer';

import {
  cleanConversationHistory,
  cleanSelectedConversation,
} from '@/utils/app/clean';
import { DEFAULT_SYSTEM_PROMPT, DEFAULT_TEMPERATURE } from '@/utils/app/const';
import {
  saveConversation,
  saveConversations,
  updateConversation,
} from '@/utils/app/conversation';
import { getSettings } from '@/utils/app/settings';
import { getChatbotById } from '@/utils/data/supabase';

import { ChatBot, Conversation } from '@/types/chat';
import { KeyValuePair } from '@/types/data';
import { HomeInitialState } from '@/types/home';

import { Chat } from '@/components/Chat/Chat';
import { Chatbar } from '@/components/Chatbar/Chatbar';
import Loading from '@/components/Loading';
import { Navbar } from '@/components/Mobile/Navbar';

import HomeContext from '@/contexts/home.context';
import { useUser } from '@auth0/nextjs-auth0/client';
import { v4 as uuidv4 } from 'uuid';

const initialState: HomeInitialState = {
  loading: false,
  lightMode: 'dark',
  messageIsStreaming: false,
  conversations: [],
  selectedConversation: undefined,
  currentMessage: undefined,
  temperature: 1,
  showChatbar: true,
  messageError: false,
  searchTerm: '',
};

const Chatbot = () => {
  const router = useRouter();
  const { id, iframe } = router.query;

  const [isIframe, setIsIframe] = useState<boolean>(false);

  const { user, error: authError, isLoading } = useUser();

  // @ts-ignore
  const [chatbot, setChatbot] = useState<ChatBot>(null);

  const contextValue = useCreateReducer<HomeInitialState>({
    initialState,
  });

  const {
    state: { lightMode, conversations, selectedConversation },
    dispatch,
  } = contextValue;

  const stopConversationRef = useRef<boolean>(false);

  const handleSelectConversation = (conversation: Conversation) => {
    dispatch({
      field: 'selectedConversation',
      value: conversation,
    });

    saveConversation(conversation, chatbot?.namespace);
  };

  // CONVERSATION OPERATIONS  --------------------------------------------

  const handleNewConversation = () => {
    const lastConversation = conversations[conversations.length - 1];

    const newConversation: Conversation = {
      id: uuidv4(),
      name: 'New Conversation',
      messages: [],
      prompt: DEFAULT_SYSTEM_PROMPT,
      temperature: lastConversation?.temperature ?? DEFAULT_TEMPERATURE,
    };

    const updatedConversations = [...conversations, newConversation];

    dispatch({ field: 'selectedConversation', value: newConversation });
    dispatch({ field: 'conversations', value: updatedConversations });

    saveConversation(newConversation, chatbot?.namespace);
    saveConversations(updatedConversations, chatbot?.namespace);

    dispatch({ field: 'loading', value: false });
  };

  const handleUpdateConversation = (
    conversation: Conversation,
    data: KeyValuePair,
  ) => {
    const updatedConversation = {
      ...conversation,
      [data.key]: data.value,
    };

    const { single, all } = updateConversation(
      updatedConversation,
      conversations,
      chatbot?.namespace,
    );

    dispatch({ field: 'selectedConversation', value: single });
    dispatch({ field: 'conversations', value: all });
  };

  // EFFECTS  --------------------------------------------

  useEffect(() => {
    if (window.innerWidth < 640) {
      dispatch({ field: 'showChatbar', value: false });
    }
  }, [selectedConversation]);

  useEffect(() => {
    if (id) {
      const fetchChatbot = async () => {
        // @ts-ignore
        const result = await getChatbotById(id, user?.sub);
        if (result.error) {
          console.error('Error fetching chatbot:', result.error);
        } else {
          // @ts-ignore
          setChatbot(result as ChatBot);
          setIsIframe(router.query.iframe === 'true');
        }
      };
      fetchChatbot();
    }
  }, [id, user]);

  // ON LOAD --------------------------------------------

  useEffect(() => {
    const settings = getSettings();
    if (settings.theme) {
      dispatch({
        field: 'lightMode',
        value: settings.theme,
      });
    }

    if (window.innerWidth < 640) {
      dispatch({ field: 'showChatbar', value: false });
    }

    const showChatbar = localStorage.getItem('showChatbar');
    if (showChatbar) {
      dispatch({ field: 'showChatbar', value: showChatbar === 'true' });
    }

    if (chatbot && !isIframe) {
      const conversationHistory = localStorage.getItem(
        `conversationHistory:${chatbot.namespace}`,
      );
      if (conversationHistory) {
        const parsedConversationHistory: Conversation[] =
          JSON.parse(conversationHistory);
        const cleanedConversationHistory = cleanConversationHistory(
          parsedConversationHistory,
        );
        dispatch({
          field: 'conversations',
          value: cleanedConversationHistory,
        });
      }

      const selectedConversation = localStorage.getItem(
        `selectedConversation:${chatbot.namespace}`,
      );
      if (selectedConversation) {
        const parsedSelectedConversation: Conversation =
          JSON.parse(selectedConversation);
        const cleanedSelectedConversation = cleanSelectedConversation(
          parsedSelectedConversation,
        );
        dispatch({
          field: 'selectedConversation',
          value: cleanedSelectedConversation,
        });
      }
    }
    const lastConversation = conversations[conversations.length - 1];
    dispatch({
      field: 'selectedConversation',
      value: {
        id: uuidv4(),
        name: 'New Conversation',
        messages: [],
        prompt: DEFAULT_SYSTEM_PROMPT,
        temperature: lastConversation?.temperature ?? DEFAULT_TEMPERATURE,
      },
    });
  }, [chatbot, dispatch]);

  return (
    <HomeContext.Provider
      value={{
        ...contextValue,
        handleNewConversation,
        handleSelectConversation,
        handleUpdateConversation,
      }}
    >
      <Head>
        <title>{chatbot ? `${chatbot.name} | NeuralTalk` : `NeuralTalk`}</title>
        <meta name="description" content="NeuralTalk" />
        <meta
          name="viewport"
          content="height=device-height ,width=device-width, initial-scale=1, user-scalable=no"
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      {selectedConversation && (
        <main
          className={`flex h-screen w-screen flex-col text-sm text-white dark:text-white ${lightMode}`}
        >
          {!iframe && (
            <div className="fixed top-0 w-full sm:hidden">
              <Navbar
                selectedConversation={selectedConversation}
                onNewConversation={handleNewConversation}
              />
            </div>
          )}

          <div
            className={`flex h-full w-full ${
              !isIframe ? 'pt-[48px]' : ''
            } sm:pt-0`}
          >
            {!isIframe && <Chatbar chatbot={chatbot} />}

            <div className="flex flex-1">
              <Chat
                chatbot={chatbot}
                stopConversationRef={stopConversationRef}
                isIframe={isIframe}
              />
            </div>
          </div>
        </main>
      )}
    </HomeContext.Provider>
  );
};

export default Chatbot;

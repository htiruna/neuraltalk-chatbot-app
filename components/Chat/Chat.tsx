import { IconRefresh } from '@tabler/icons-react';
import {
  MutableRefObject,
  memo,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import toast from 'react-hot-toast';

import { saveConversation, saveConversations } from '@/utils/app/conversation';
import { upsertConversationAndMessages } from '@/utils/data/supabase';
import { throttle } from '@/utils/data/throttle';

import { ChatBot, Conversation, Message } from '@/types/chat';

import { ChatInput } from './ChatInput';
import { ChatLoader } from './ChatLoader';
import { MemoizedChatMessage } from './MemoizedChatMessage';

import HomeContext from '@/contexts/home.context';
import { useUser } from '@auth0/nextjs-auth0/client';

interface Props {
  chatbot: ChatBot;
  stopConversationRef: MutableRefObject<boolean>;
  isIframe: boolean;
}

const EXAMPLE_QUESTIONS: { [key: string]: string[] } = {
  'instructional-design': [
    'What are some strategies for designing effective learning environments?',
    'What are the key questions to consider when assessing performance gaps?',
    'How can data be collected and processed to make it useful for decision-making?',
    'What are some best practices for promoting transfer of learning and automating new knowledge and skills?',
  ],
  'facilitation-skills': [
    '"How do I warm up a group?"',
    '"What are facilitation phrases?"',
    '"What are some ethical considerations that facilitators should keep in mind?"',
    '"What is the purpose of facilitation and why is it important to be clear about it?"',
  ],
};

const DEFAULT_IFRAME_MESSAGES = [
  {
    role: 'assistant',
    content:
      "Hi! I'm an AI-powered ChatBot that is trained on AITD related topics. If you have any questions, please ask me and I'll try my best to answer. Otherwise, you can contact a team member on +61 2 9211 9414.",
  },
];

export const Chat = memo(
  ({ chatbot, stopConversationRef, isIframe }: Props) => {
    const {
      state: { selectedConversation, conversations, loading },
      handleUpdateConversation,
      dispatch: homeDispatch,
    } = useContext(HomeContext);

    const { user } = useUser();

    const [_, setCurrentMessage] = useState<Message>();
    const [autoScrollEnabled, setAutoScrollEnabled] = useState<boolean>(
      !isIframe,
    );
    const [showScrollDownButton, setShowScrollDownButton] =
      useState<boolean>(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const chatContainerRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const handleSend = useCallback(
      async (message: Message, deleteCount = 0) => {
        if (selectedConversation) {
          let updatedConversation: Conversation;
          if (deleteCount) {
            const updatedMessages = [...selectedConversation.messages];
            for (let i = 0; i < deleteCount; i++) {
              updatedMessages.pop();
            }
            updatedConversation = {
              ...selectedConversation,
              messages: [...updatedMessages, message],
            };
          } else {
            updatedConversation = {
              ...selectedConversation,
              messages: [...selectedConversation.messages, message],
            };
          }
          homeDispatch({
            field: 'selectedConversation',
            value: updatedConversation,
          });
          homeDispatch({ field: 'loading', value: true });
          homeDispatch({ field: 'messageIsStreaming', value: true });

          const messages = updatedConversation?.messages;
          const chat_history: string[][] = messages.reduce(
            (acc: string[][], { content }, i) => {
              if (i % 2 === 0 && i < messages.length - 1) {
                acc.push([content, messages[i + 1].content]);
              }
              return acc;
            },
            [],
          );

          const chatBody = {
            question: message?.content,
            chat_history,
            namespace: chatbot?.namespace,
          };

          const endpoint = 'api/chat';
          const body = JSON.stringify(chatBody);

          const controller = new AbortController();
          const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            signal: controller.signal,
            body,
          });
          if (!response.ok) {
            homeDispatch({ field: 'loading', value: false });
            homeDispatch({ field: 'messageIsStreaming', value: false });
            toast.error(response.statusText);
            return;
          }
          const data = response.body;
          if (!data) {
            homeDispatch({ field: 'loading', value: false });
            homeDispatch({ field: 'messageIsStreaming', value: false });
            return;
          }
          if (updatedConversation.messages.length === 1) {
            const { content } = message;
            const customName =
              content.length > 30 ? content.substring(0, 30) + '...' : content;
            updatedConversation = {
              ...updatedConversation,
              name: customName,
            };
          }
          homeDispatch({ field: 'loading', value: false });
          const reader = data.getReader();
          const decoder = new TextDecoder();
          let done = false;
          let isFirst = true;
          let text = '';
          while (!done) {
            if (stopConversationRef.current === true) {
              controller.abort();
              done = true;
              break;
            }
            const { value, done: doneReading } = await reader.read();
            done = doneReading;
            const chunkValue = decoder.decode(value);

            text += chunkValue;
            if (isFirst) {
              isFirst = false;
              const updatedMessages: Message[] = [
                ...updatedConversation.messages,
                { role: 'assistant', content: chunkValue },
              ];
              updatedConversation = {
                ...updatedConversation,
                messages: updatedMessages,
              };
              homeDispatch({
                field: 'selectedConversation',
                value: updatedConversation,
              });
            } else {
              const updatedMessages: Message[] =
                updatedConversation.messages.map((message, index) => {
                  if (index === updatedConversation.messages.length - 1) {
                    return {
                      ...message,
                      content: text,
                    };
                  }
                  return message;
                });
              updatedConversation = {
                ...updatedConversation,
                messages: updatedMessages,
              };
              homeDispatch({
                field: 'selectedConversation',
                value: updatedConversation,
              });
            }
          }
          saveConversation(updatedConversation, chatbot?.namespace);

          if (updatedConversation.messages.length > 0) {
            upsertConversationAndMessages(
              updatedConversation?.id,
              // @ts-ignore
              user?.sub,
              chatbot?.id,
              updatedConversation?.messages,
            );
          }

          const updatedConversations: Conversation[] = conversations.map(
            (conversation) => {
              if (conversation.id === selectedConversation.id) {
                return updatedConversation;
              }
              return conversation;
            },
          );
          if (updatedConversations.length === 0) {
            updatedConversations.push(updatedConversation);
          }
          homeDispatch({ field: 'conversations', value: updatedConversations });
          saveConversations(updatedConversations, chatbot?.namespace);
          homeDispatch({ field: 'messageIsStreaming', value: false });
        }
      },
      [conversations, selectedConversation, stopConversationRef],
    );

    const handleScroll = () => {
      if (chatContainerRef.current) {
        const { scrollTop, scrollHeight, clientHeight } =
          chatContainerRef.current;
        const bottomTolerance = 30;

        if (scrollTop + clientHeight < scrollHeight - bottomTolerance) {
          setAutoScrollEnabled(false);
          setShowScrollDownButton(true);
        } else {
          setAutoScrollEnabled(true);
          setShowScrollDownButton(false);
        }
      }
    };

    const handleScrollDown = () => {
      chatContainerRef.current?.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: 'smooth',
      });
    };

    const onClearAll = () => {
      if (
        confirm('Are you sure you want to clear all messages?') &&
        selectedConversation
      ) {
        handleUpdateConversation(selectedConversation, {
          key: 'messages',
          value: [],
        });
      }
    };

    const scrollDown = () => {
      if (autoScrollEnabled) {
        messagesEndRef.current?.scrollIntoView(true);
      }
    };
    const throttledScrollDown = throttle(scrollDown, 250);

    useEffect(() => {
      if (!isIframe) {
        throttledScrollDown();
      }
      selectedConversation &&
        setCurrentMessage(
          selectedConversation.messages[
            selectedConversation.messages.length - 2
          ],
        );
    }, [selectedConversation, throttledScrollDown]);

    useEffect(() => {
      const observer = new IntersectionObserver(
        ([entry]) => {
          setAutoScrollEnabled(entry.isIntersecting);
          if (entry.isIntersecting) {
            textareaRef.current?.focus();
          }
        },
        {
          root: null,
          threshold: 0.5,
        },
      );
      const messagesEndElement = messagesEndRef.current;
      if (messagesEndElement) {
        observer.observe(messagesEndElement);
      }
      return () => {
        if (messagesEndElement) {
          observer.unobserve(messagesEndElement);
        }
      };
    }, [messagesEndRef]);

    const conversationMessages = isIframe
      ? // @ts-ignore
        [...DEFAULT_IFRAME_MESSAGES, ...selectedConversation?.messages]
      : selectedConversation?.messages;

    return (
      <div className="relative flex-1 overflow-hidden bg-white dark:bg-[#343541]">
        {
          <>
            <div
              className="h-full overflow-x-hidden"
              ref={chatContainerRef}
              onScroll={handleScroll}
            >
              {selectedConversation?.messages.length === 0 && !isIframe ? (
                <>
                  <div className="h-full mx-auto flex flex-col space-y-5 md:space-y-10 px-3 pt-5 pb-28 md:pt-12 sm:max-w-[800px] justify-center">
                    <div className="relative mx-auto flex max-w-3xl flex-col items-center text-center">
                      <h2 className="text-3xl font-bold tracking-tight text-black sm:text-4xl">
                        {chatbot?.name}
                      </h2>
                      <p className="mt-8 text-black">
                        Hi there, I&apos;m a chatbot trained on {chatbot?.name}.
                        Here are some examples of questions you can ask me:
                      </p>
                    </div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      {EXAMPLE_QUESTIONS[chatbot?.namespace]?.map(
                        (question: string, i) => (
                          <div
                            key={i}
                            className="relative flex items-center space-x-3 rounded-lg border border-gray-300 bg-white px-6 py-10 shadow-sm focus-within:ring-2 focus-within:ring-indigo-500 focus-within:ring-offset-2 hover:border-gray-400"
                            onClick={() => {
                              const content = question.replace(/"/g, '');
                              handleSend({ role: 'user', content });
                            }}
                          >
                            <div className="min-w-0 flex-1 text-center">
                              <a href="#" className="focus:outline-none">
                                <span
                                  className="absolute inset-0"
                                  aria-hidden="true"
                                />
                                <p className="text-sm font-medium text-gray-900">
                                  {question}
                                </p>
                              </a>
                            </div>
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {!isIframe && (
                    <div className="sticky top-0 z-10 flex justify-center border border-b-neutral-300 bg-neutral-100 py-2 text-sm text-neutral-500 dark:border-none dark:bg-[#444654] dark:text-neutral-200">
                      {chatbot?.name}
                      <button
                        className="ml-2 cursor-pointer hover:opacity-50"
                        onClick={onClearAll}
                      >
                        <IconRefresh size={18} />
                      </button>
                    </div>
                  )}

                  {conversationMessages?.map((message, index) => (
                    <MemoizedChatMessage
                      key={index}
                      message={message}
                      messageIndex={index}
                      isIframe={isIframe}
                    />
                  ))}

                  {loading && <ChatLoader isIframe={isIframe} />}

                  <div
                    className="h-[162px] bg-white dark:bg-[#343541]"
                    ref={messagesEndRef}
                  />
                </>
              )}
            </div>

            <ChatInput
              stopConversationRef={stopConversationRef}
              textareaRef={textareaRef}
              onSend={(message) => {
                setCurrentMessage(message);
                handleSend(message, 0);
              }}
              onScrollDownClick={handleScrollDown}
              showScrollDownButton={showScrollDownButton}
              isIframe={isIframe}
            />
          </>
        }
      </div>
    );
  },
);

Chat.displayName = 'Chat';

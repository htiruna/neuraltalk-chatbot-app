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

import Image from 'next/image';

import { saveConversation, saveConversations } from '@/utils/app/conversation';
import { throttle } from '@/utils/data/throttle';

import { Conversation, Message } from '@/types/chat';

import { ChatInput } from './ChatInput';
import { ChatLoader } from './ChatLoader';
import { MemoizedChatMessage } from './MemoizedChatMessage';

import HomeContext from '@/contexts/home.context';

interface Props {
  stopConversationRef: MutableRefObject<boolean>;
}

export const Chat = memo(({ stopConversationRef }: Props) => {
  const {
    state: { selectedConversation, conversations, loading },
    handleUpdateConversation,
    dispatch: homeDispatch,
  } = useContext(HomeContext);

  const [currentMessage, setCurrentMessage] = useState<Message>();
  const [autoScrollEnabled, setAutoScrollEnabled] = useState<boolean>(true);
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
        };

        const endpoint = 'https://neuraltalk-api.vercel.app/chat';
        const body = JSON.stringify(chatBody);

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body,
        });
        if (!response.ok) {
          homeDispatch({ field: 'loading', value: false });
          homeDispatch({ field: 'messageIsStreaming', value: false });
          toast.error(response.statusText);
          return;
        }
        const data = await response.json();
        if (!data) {
          homeDispatch({ field: 'loading', value: false });
          homeDispatch({ field: 'messageIsStreaming', value: false });
          return;
        }

        if (updatedConversation.messages.length === 1) {
          const { content } = message;
          console.log('message content', content);
          const customName =
            content.length > 30 ? content.substring(0, 30) + '...' : content;
          console.log('customName', customName);

          updatedConversation = {
            ...updatedConversation,
            name: customName,
          };
        }

        homeDispatch({ field: 'loading', value: false });

        const updatedMessages: Message[] = [
          ...updatedConversation.messages,
          // @ts-ignore
          { role: 'assistant', content: data.answer },
        ];
        updatedConversation = {
          ...updatedConversation,
          messages: updatedMessages,
        };
        homeDispatch({
          field: 'selectedConversation',
          value: updatedConversation,
        });

        saveConversation(updatedConversation);
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
        saveConversations(updatedConversations);
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
    throttledScrollDown();
    selectedConversation &&
      setCurrentMessage(
        selectedConversation.messages[selectedConversation.messages.length - 2],
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

  return (
    <div className="relative flex-1 overflow-hidden bg-white dark:bg-[#343541]">
      {
        <>
          <div
            className="max-h-full overflow-x-hidden"
            ref={chatContainerRef}
            onScroll={handleScroll}
          >
            {selectedConversation?.messages.length === 0 ? (
              <>
                <div className="mx-auto flex flex-col space-y-5 md:space-y-10 px-3 pt-5 md:pt-12 sm:max-w-[800px]">
                  <div className="text-center text-3xl font-semibold text-gray-800 dark:text-gray-100">
                    Curriculum Management
                  </div>
                  <div className="flex items-center h-full flex-row space-x-6 rounded-lg border border-neutral-200 p-4 dark:border-neutral-600">
                    <div className="shadow-md">
                      <Image
                        src="/curriculum-mgmt.png"
                        alt="Curriculum Management"
                        width={1262}
                        height={1724}
                        className="max-w-[175px]"
                      />
                    </div>
                    <div>
                      <div className="text-[12px] text-black/50 dark:text-white/50 text-sm space-y-4 mb-4">
                        <p>
                          Hi there! I&#39;m a chatbot trained on the Curriculum
                          Management Configuration and Processing Workbook.
                        </p>
                        <p className="font-bold">
                          Examples of questions you can ask me are:
                        </p>
                      </div>
                      <ul className="list-disc list-inside text-[12px] text-black/50 dark:text-white/50 text-sm space-y-2">
                        <li>
                          What processes are included in curriculum management?
                        </li>
                        <li>
                          How does curriculum management affect student study
                          plans and enrolment?
                        </li>
                        <li>
                          What fields are mandatory when creating a Study
                          Package Availability?
                        </li>
                        <li>
                          What is the purpose of configuring curriculum
                          structures and templates?
                        </li>
                        <li>
                          How can study measures be managed and configured in a
                          study package?
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="sticky top-0 z-10 flex justify-center border border-b-neutral-300 bg-neutral-100 py-2 text-sm text-neutral-500 dark:border-none dark:bg-[#444654] dark:text-neutral-200">
                  {'Curriculum Management'}
                  <button
                    className="ml-2 cursor-pointer hover:opacity-50"
                    onClick={onClearAll}
                  >
                    <IconRefresh size={18} />
                  </button>
                </div>

                {selectedConversation?.messages.map((message, index) => (
                  <MemoizedChatMessage
                    key={index}
                    message={message}
                    messageIndex={index}
                    onEdit={(editedMessage) => {
                      setCurrentMessage(editedMessage);
                      // discard edited message and the ones that come after then resend
                      handleSend(
                        editedMessage,
                        selectedConversation?.messages.length - index,
                      );
                    }}
                  />
                ))}

                {loading && <ChatLoader />}

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
            onRegenerate={() => {
              if (currentMessage) {
                handleSend(currentMessage, 2);
              }
            }}
            showScrollDownButton={showScrollDownButton}
          />
        </>
      }
    </div>
  );
});
Chat.displayName = 'Chat';

import { IconRobot, IconUser } from '@tabler/icons-react';
import { FC, memo, useContext, useEffect, useState } from 'react';

import { Message } from '@/types/chat';

import { CodeBlock } from '../Markdown/CodeBlock';
import { MemoizedReactMarkdown } from '../Markdown/MemoizedReactMarkdown';

import HomeContext from '@/contexts/home.context';
import rehypeMathjax from 'rehype-mathjax';
import remarkGfm from 'remark-gfm';

export interface Props {
  message: Message;
  messageIndex: number;
  isIframe: boolean;
}

export const ChatMessage: FC<Props> = memo(
  ({ message, messageIndex, isIframe }) => {
    const {
      state: { selectedConversation, messageIsStreaming },
      dispatch: homeDispatch,
    } = useContext(HomeContext);

    const [messageContent, setMessageContent] = useState(message.content);

    useEffect(() => {
      setMessageContent(message.content);
    }, [message.content]);

    let endMessageIndicatorIndex =
      (selectedConversation?.messages.length ?? 0) - 1;
    if (isIframe) {
      endMessageIndicatorIndex = endMessageIndicatorIndex + 2;
    }

    return (
      <div
        className={`group md:px-4 ${
          message.role === 'assistant'
            ? 'border-b border-black/10 bg-gray-50 text-gray-800 dark:border-gray-900/50 dark:bg-[#444654] dark:text-gray-100'
            : 'border-b border-black/10 bg-white text-gray-800 dark:border-gray-900/50 dark:bg-[#343541] dark:text-gray-100'
        }`}
        style={{ overflowWrap: 'anywhere' }}
      >
        <div
          className={`relative m-auto flex p-4 text-base ${
            isIframe
              ? 'w-full'
              : 'md:max-w-2xl lg:max-w-2xl xl:max-w-3xl lg:px-0'
          } md:gap-6 md:py-6`}
        >
          <div className="min-w-[40px] text-right font-bold">
            {message.role === 'assistant' ? (
              <IconRobot size={30} />
            ) : (
              <IconUser size={30} />
            )}
          </div>

          <div
            className={`prose mt-[-2px] w-full dark:prose-invert ${
              isIframe ? 'max-w-none' : ''
            }`}
          >
            {message.role === 'user' ? (
              <div className="flex w-full">
                <div
                  className={`prose ${
                    isIframe ? 'max-w-none' : ''
                  } whitespace-pre-wrap dark:prose-invert`}
                >
                  {message.content}
                </div>
              </div>
            ) : (
              <div className="flex w-full">
                <MemoizedReactMarkdown
                  className={`prose dark:prose-invert ${
                    isIframe ? 'max-w-none' : ''
                  }`}
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeMathjax]}
                  components={{
                    code({ node, inline, className, children, ...props }) {
                      if (children.length) {
                        if (children[0] == '▍') {
                          return (
                            <span className="animate-pulse cursor-default mt-1">
                              ▍
                            </span>
                          );
                        }

                        children[0] = (children[0] as string).replace(
                          '`▍`',
                          '▍',
                        );
                      }

                      const match = /language-(\w+)/.exec(className || '');

                      return !inline ? (
                        <CodeBlock
                          key={Math.random()}
                          language={(match && match[1]) || ''}
                          value={String(children).replace(/\n$/, '')}
                          {...props}
                        />
                      ) : (
                        <code className={className} {...props}>
                          {children}
                        </code>
                      );
                    },
                    table({ children }) {
                      return (
                        <table className="border-collapse border border-black px-3 py-1 dark:border-white">
                          {children}
                        </table>
                      );
                    },
                    th({ children }) {
                      return (
                        <th className="break-words border border-black bg-gray-500 px-3 py-1 text-white dark:border-white">
                          {children}
                        </th>
                      );
                    },
                    td({ children }) {
                      return (
                        <td className="break-words border border-black px-3 py-1 dark:border-white">
                          {children}
                        </td>
                      );
                    },
                  }}
                >
                  {`${message.content}${
                    messageIsStreaming &&
                    messageIndex == endMessageIndicatorIndex
                      ? '`▍`'
                      : ''
                  }`}
                </MemoizedReactMarkdown>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  },
);

ChatMessage.displayName = 'ChatMessage';

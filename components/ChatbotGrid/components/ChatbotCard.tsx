import Image from 'next/image';
import Link from 'next/link';

import { ChatBot } from '@/types/chat';

interface Props {
  chatbot: ChatBot;
}

const ChatbotCard = ({ chatbot }: Props) => {
  return (
    <li className="col-span-1">
      <Link href={`/chatbot?id=${chatbot.id}`}>
        <div className="group bg-white relative text-left bg-panel-header-light dark:bg-panel-header-dark border border-panel-border-light dark:border-panel-border-dark rounded-md py-4 px-6 flex flex-row transition ease-in-out duration-150 h-48 cursor-pointer hover:bg-panel-border-light dark:hover:bg-panel-border-dark hover:border-panel-border-hover-light dark:hover:border-panel-border-hover-dark hover:border-gray-300 shadow-sm">
          <Image
            src={`/thumbnails/${chatbot.namespace}.png`}
            width={100}
            height={100}
            className="w-1/4 h-full object-cover rounded-md mr-4"
            alt={chatbot.name}
          />

          <div className="flex h-full w-full flex-col space-y-2">
            <h5 className="text-scale-1200">
              <div className="flex w-full flex-row justify-between gap-1">
                <span className="flex-shrink truncate">{chatbot.name}</span>
              </div>
            </h5>
            <div className="w-full">
              <div className="flex items-end justify-between">
                <span className="text-sm text-gray-400">
                  {chatbot.description}
                </span>
              </div>
            </div>
            {/* <div className="absolute bottom-4 left-6 text-xs text-gray-500">
              1d ago
            </div> */}
          </div>
          <div className=" absolute right-4 top-4 transition-all duration-200 group-hover:right-3">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="21"
              height="21"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-linecap="round"
              stroke-linejoin="round"
              className="sbui-icon "
            >
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </div>
        </div>
      </Link>
    </li>
  );
};

export default ChatbotCard;

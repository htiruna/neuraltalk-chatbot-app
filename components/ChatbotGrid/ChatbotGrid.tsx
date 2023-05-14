import { ChatBot } from '@/types/chat';

import ChatbotCard from './components/ChatbotCard';

interface Props {
  chatbots: ChatBot[];
}

const ChatbotGrid = ({ chatbots }: Props) => {
  return (
    <ul className="mx-auto grid grid-cols-1 gap-4 sm:grid-cols-1 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
      {chatbots.map((chatbot: ChatBot) => (
        <ChatbotCard chatbot={chatbot} />
      ))}
    </ul>
  );
};

export default ChatbotGrid;

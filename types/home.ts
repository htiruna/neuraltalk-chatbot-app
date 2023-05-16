import { Conversation, Message } from './chat';

export interface HomeInitialState {
  loading: boolean;
  lightMode: 'light' | 'dark';
  messageIsStreaming: boolean;
  conversations: Conversation[];
  selectedConversation: Conversation | undefined;
  currentMessage: Message | undefined;
  temperature: number;
  showChatbar: boolean;
  messageError: boolean;
  searchTerm: string;
}

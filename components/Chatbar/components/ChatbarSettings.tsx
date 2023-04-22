import { IconLogout } from '@tabler/icons-react';
import { useContext } from 'react';

import { useRouter } from 'next/router';

import { SidebarButton } from '../../Sidebar/SidebarButton';
import ChatbarContext from '../Chatbar.context';
import { ClearConversations } from './ClearConversations';

import HomeContext from '@/contexts/home.context';

export const ChatbarSettings = () => {
  const router = useRouter();

  const {
    state: { conversations },
    dispatch: homeDispatch,
  } = useContext(HomeContext);

  const { handleClearConversations } = useContext(ChatbarContext);

  return (
    <div className="flex flex-col items-center space-y-1 border-t border-black/20 pt-1 text-sm">
      {conversations.length > 0 ? (
        <ClearConversations onClearConversations={handleClearConversations} />
      ) : null}

      <SidebarButton
        text={'Logout'}
        icon={<IconLogout size={18} />}
        onClick={() => {
          router.push('/api/auth/logout');
        }}
      />
    </div>
  );
};

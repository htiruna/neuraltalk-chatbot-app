import { IconRobot } from '@tabler/icons-react';
import { FC } from 'react';

interface Props {
  isIframe: boolean;
}

export const ChatLoader: FC<Props> = ({ isIframe }) => {
  return (
    <div
      className="group border-b border-black/10 bg-gray-50 text-gray-800 dark:border-gray-900/50 dark:bg-[#444654] dark:text-gray-100"
      style={{ overflowWrap: 'anywhere' }}
    >
      <div
        className={`flex gap-4 p-4 text-base md:gap-6 md:py-6 lg:px-0 ${
          isIframe
            ? 'w-full mx-8'
            : 'm-auto md:max-w-2xl lg:max-w-2xl xl:max-w-3xl'
        }`}
      >
        <div className="min-w-[40px] items-end">
          <IconRobot size={30} />
        </div>
        <span className="animate-pulse cursor-default mt-1">▍</span>
      </div>
    </div>
  );
};

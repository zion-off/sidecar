import { HiMiniSparkles } from 'react-icons/hi2';
import { TbReload, TbLayoutSidebarRightCollapse } from 'react-icons/tb';
import { Toaster } from 'sonner';
import { useEffect, useState } from 'react';
import { Chat } from '@/components/Chat';
import { ChatProvider, useChatContext } from '@/context/ChatContext';
import { MSG } from '@/types/messages';
import { postMessageToParent } from '@/utils/messaging';

function AppFrame() {
  const { resetChat } = useChatContext();

  return (
    <div className="flex h-full w-full max-w-full flex-col overflow-hidden bg-lc-bg-base">
      <Toaster />
      <div className="flex h-9 items-center justify-between bg-lc-layer-one p-1 pl-3 pr-1">
        <span className="flex items-center gap-1">
          {HiMiniSparkles({ className: 'text-yellow-500' })}
          <h2 className="text-[14px] font-[600] text-lc-primary">Sidecar</h2>
        </span>
        <div className="flex items-center">
          <span
            onClick={resetChat}
            className="flex h-6 w-6 cursor-pointer items-center justify-center rounded-md p-[5px] text-neutral-400 hover:text-neutral-500 dark:hover:bg-white/10 dark:hover:text-neutral-500"
            title="Reset chat"
          >
            {TbReload({ className: 'h-[14px] w-[14px]' })}
          </span>
          <span
            onClick={() => postMessageToParent({ type: MSG.CLOSE_PANEL })}
            className="flex h-6 w-6 cursor-pointer items-center justify-center rounded-md p-[5px] text-neutral-400 hover:text-neutral-500 dark:hover:bg-white/10 dark:hover:text-neutral-500"
            title="Close panel"
          >
            {TbLayoutSidebarRightCollapse({ className: 'h-[14px] w-[14px]' })}
          </span>
        </div>
      </div>

      <Chat />
    </div>
  );
}

function App() {
  const [problemTitle, setProblemTitle] = useState<string | null>(null);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === MSG.PROBLEM_TITLE_UPDATE) {
        setProblemTitle(event.data.data.title);
      }
    };

    window.addEventListener('message', handleMessage);
    setTimeout(() => {
      postMessageToParent({ type: MSG.REQUEST_PROBLEM_TITLE });
    }, 500);

    return () => window.removeEventListener('message', handleMessage);
  }, []);

  if (!problemTitle) {
    return (
      <div className="flex h-full items-center justify-center bg-lc-bg-base">
        <div className="text-center">
          <p className="animate-pulse text-neutral-500">Loading problem...</p>
        </div>
      </div>
    );
  }

  return (
    <ChatProvider problemTitle={problemTitle}>
      <AppFrame />
    </ChatProvider>
  );
}

export default App;

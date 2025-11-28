import Pusher from 'pusher-js';

export type ChatEvent = {
  sender: string;
  status?: string;
  reply?: string;
  message?: string;
  conversationId: string | null;
};

export function subscribeConversation(conversationId: string, onMessage: (data: ChatEvent) => void) {
  const key = import.meta.env.VITE_PUSHER_KEY;
  const cluster = import.meta.env.VITE_PUSHER_CLUSTER;
  const pusher = new Pusher(key, { cluster });
  const channelName = `chat-${conversationId}`;
  const channel = pusher.subscribe(channelName);
  channel.bind('new-message', (data: ChatEvent) => {
    onMessage(data);
  });
  return () => {
    channel.unbind_all();
    pusher.unsubscribe(channelName);
    pusher.disconnect();
  };
}

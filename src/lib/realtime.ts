import Pusher from 'pusher-js';

export type ChatEvent = {
  sender: string;
  status: string;
  reply: string;
  conversationId: string | null;
};

function channelForUser(user: string) {
  const safe = user.trim().toLowerCase().replace(/[^a-z0-9_-]+/g, '_');
  return `chat-${safe}`;
}

export function subscribeUserChat(user: string, onMessage: (data: ChatEvent) => void) {
  const key = import.meta.env.VITE_PUSHER_KEY;
  const cluster = import.meta.env.VITE_PUSHER_CLUSTER;
  const pusher = new Pusher(key, { cluster });
  const channelName = channelForUser(user);
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

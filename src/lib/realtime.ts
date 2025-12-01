import Pusher from 'pusher-js';

export type ChatEvent = {
  sender: string;
  status: string;
  reply: string;
  conversationId: string | null;
};

export function subscribeGlobalChat(onMessage: (data: ChatEvent) => void) {
  const key = import.meta.env.VITE_PUSHER_KEY;
  const cluster = import.meta.env.VITE_PUSHER_CLUSTER;
  const pusher = new Pusher(key, { cluster });
  const channel = pusher.subscribe('global-chat');
  channel.bind('new-message', (data: ChatEvent) => {
    onMessage(data);
  });
  return () => {
    channel.unbind_all();
    pusher.unsubscribe('global-chat');
    pusher.disconnect();
  };
}

export function subscribeUserChat(user: string, moduleId: string, onMessage: (data: ChatEvent) => void) {
  const key = import.meta.env.VITE_PUSHER_KEY;
  const cluster = import.meta.env.VITE_PUSHER_CLUSTER;
  const pusher = new Pusher(key, { cluster });
  const channelName = `chat-${moduleId}-${user}`;
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

export function subscribeConversationChat(conversationId: string, onMessage: (data: ChatEvent) => void) {
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

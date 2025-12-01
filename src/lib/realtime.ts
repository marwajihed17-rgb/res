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

export function subscribeConversation(conversationId: string, onMessage: (data: ChatEvent) => void) {
  const key = import.meta.env.VITE_PUSHER_KEY;
  const cluster = import.meta.env.VITE_PUSHER_CLUSTER;
  const user = conversationId.startsWith('user:') ? conversationId.slice(5) : conversationId;
  const pusher = new Pusher(key, {
    cluster,
    authEndpoint: '/api/pusherAuth',
    auth: { headers: { 'X-User': user } },
  });
  const channelName = `private-conversation-${conversationId}`;
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

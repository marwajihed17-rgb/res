import Pusher from 'pusher-js';

export type ChatEvent = {
  sender: string;
  status: string;
  reply: string;
  conversationId: string | null;
};

export function subscribeToChat(conversationId: string, onMessage: (data: ChatEvent) => void) {
  const key = import.meta.env.VITE_PUSHER_KEY;
  const cluster = import.meta.env.VITE_PUSHER_CLUSTER;
  const pusher = new Pusher(key, { cluster });
  const channelName = `chat-${conversationId}`;
  console.log('Subscribed to conversationId:', conversationId, 'channel:', channelName);
  const channel = pusher.subscribe(channelName);
  channel.bind('new-message', (data: ChatEvent) => {
    console.log('Received event on', channelName, data);
    onMessage(data);
  });
  pusher.connection.bind('error', (err: any) => {
    console.error('Pusher connection error', err);
  });
  return () => {
    channel.unbind_all();
    pusher.unsubscribe(channelName);
    pusher.disconnect();
  };
}

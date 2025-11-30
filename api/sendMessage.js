const { json } = require('micro');
const Pusher = require('pusher');

const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID,
  key: process.env.PUSHER_KEY,
  secret: process.env.PUSHER_SECRET,
  cluster: process.env.PUSHER_CLUSTER,
  useTLS: true,
});

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    return res.end('Method Not Allowed');
  }

  if (req.headers['authorization'] !== `Bearer ${process.env.N8N_SEND_SECRET}`) {
    res.statusCode = 401;
    return res.end('Unauthorized');
  }

  try {
    const body = await json(req);

    const requiredKeys = ['sender', 'status', 'reply', 'conversationId'];
    for (const key of requiredKeys) {
      if (!(key in body)) {
        res.statusCode = 400;
        return res.end(JSON.stringify({ error: `Missing key: ${key}` }));
      }
    }

    const recipient = body.sender;
    const channel = `user-${recipient}`;
    await pusher.trigger(channel, 'new-message', body);

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ success: true }));
  } catch (err) {
    console.error(err);
    res.statusCode = 500;
    res.end(JSON.stringify({ error: 'Internal error' }));
  }
};

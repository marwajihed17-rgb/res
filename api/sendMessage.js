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
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ error: 'Method not allowed' }));
  }

  if (req.headers['authorization'] !== `Bearer ${process.env.N8N_SEND_SECRET}`) {
    res.statusCode = 401;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ error: 'Unauthorized' }));
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

    const conversationId = body.conversationId;
    if (!conversationId || String(conversationId).trim() === '') {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({ error: 'Missing conversationId. Message cannot be routed.' }));
    }

    const channel = `chat-${String(conversationId)}`;

    const payload = {
      sender: body.sender,
      status: body.status,
      reply: body.reply,
      conversationId: conversationId,
      timestamp: Date.now(),
    };

    await pusher.trigger(channel, 'new-message', payload);

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ success: true, deliveredTo: channel, payload }));
  } catch (err) {
    console.error(err);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Internal server error', details: err?.message }));
  }
};

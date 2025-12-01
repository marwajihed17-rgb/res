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

  const user = req.headers['x-user'];
  if (!user || typeof user !== 'string' || !user.trim()) {
    res.statusCode = 401;
    return res.end('Unauthorized');
  }

  let body;
  try {
    body = await json(req);
  } catch {
    res.statusCode = 400;
    return res.end('Bad Request');
  }

  const { socket_id, channel_name } = body || {};
  if (!socket_id || !channel_name) {
    res.statusCode = 400;
    return res.end('Bad Request');
  }

  const expectedChannel = `private-conversation-user:${user}`;
  if (channel_name !== expectedChannel) {
    res.statusCode = 403;
    return res.end('Forbidden');
  }

  const authResponse = pusher.authenticate(socket_id, channel_name);
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  return res.end(JSON.stringify(authResponse));
};


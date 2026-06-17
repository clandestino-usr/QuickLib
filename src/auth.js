const fs     = require('fs');
const crypto = require('crypto');

const usersFile = process.env.AUTH_USERS_FILE;

const users = {};

if (usersFile) {
  let raw;
  try {
    raw = fs.readFileSync(usersFile, 'utf8');
  } catch (err) {
    console.error(`[quicklib] Cannot read AUTH_USERS_FILE (${usersFile}): ${err.message}`);
    process.exit(1);
  }
  for (const line of raw.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const colon = trimmed.indexOf(':');
    if (colon === -1) continue;
    const username = trimmed.slice(0, colon).trim();
    const hash     = trimmed.slice(colon + 1).trim();
    if (username && hash) users[username] = hash;
  }
  console.log(`[quicklib] Auth: ${Object.keys(users).length} user(s) loaded from ${usersFile}`);
} else {
  console.warn('[quicklib] AUTH_USERS_FILE not set — authentication disabled');
}

const authEnabled = Boolean(usersFile);

function checkCredentials(username, password) {
  const expected = users[username];
  if (!expected) return false;
  const hash = crypto.createHash('sha256').update(password).digest('hex');
  const a = Buffer.from(hash);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

function requireAuth(req, res, next) {
  if (!authEnabled) return next();
  if (req.session && req.session.authenticated) return next();
  res.redirect('/login');
}

module.exports = { requireAuth, checkCredentials, authEnabled };

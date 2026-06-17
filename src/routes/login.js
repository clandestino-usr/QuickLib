const express = require('express');
const router  = express.Router();
const { checkCredentials, authEnabled } = require('../auth');
const { renderLoginPage }               = require('../views/loginPage');

router.get('/login', (req, res) => {
  if (!authEnabled || (req.session && req.session.authenticated)) return res.redirect('/');
  res.send(renderLoginPage());
});

router.post('/login', (req, res) => {
  if (!authEnabled) return res.redirect('/');
  const { username, password } = req.body;
  if (checkCredentials(String(username || ''), String(password || ''))) {
    req.session.authenticated = true;
    res.redirect('/');
  } else {
    res.send(renderLoginPage({ error: 'Identifiants incorrects.' }));
  }
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/login'));
});

module.exports = router;

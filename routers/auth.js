const express = require('express');
const bifrost = require('express-bifrost');
const passport = require('passport');

const router = express.Router();

const notifySignIn = bifrost({
  req: (req) => Promise.resolve(req.user.getSummary()),
  res: (res, user) => {
    function popupNotifier(user) {
      window.opener.postMessage({ type: 'SIGNED_IN', user }, '*');
      window.close();
    }

    res.send(`<script>(${popupNotifier})(${JSON.stringify(user)});</script>`);
  }
});

// router.get('/facebook', passport.authenticate('facebook'));
// router.get('/facebook/callback', passport.authenticate('facebook', { failureRedirect: '/login' }), notifySignIn);
// router.get('/twitter', passport.authenticate('twitter'));
// router.get('/twitter/callback', passport.authenticate('twitter', { failureRedirect: '/login' }), notifySignIn);
router.get('/github', passport.authenticate('github'));
router.get('/github/callback', passport.authenticate('github', { failureRedirect: '/login' }), notifySignIn);
// router.get('/google', passport.authenticate('google', { scope: [ 'profile' ] }));
// router.get('/google/callback', passport.authenticate('google', { failureRedirect: '/login' }), notifySignIn);

router.post('/signOut', (req, res) => {
  req.logout();
  res.end();
});

module.exports = router;

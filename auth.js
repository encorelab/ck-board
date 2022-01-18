const { domain, clientId } = require("./auth_config.json");
const express = require("express");
const router = express.Router();
const passport = require("passport");
const querystring = require("querystring");

router.get(
  "/login",
  passport.authenticate("auth0", {
    scope: "openid email profile",
  }),
  (req, res) => {
    res.redirect("/");
  }
);

router.get("/callback", (req, res, next) => {
  passport.authenticate("auth0", (err, user, info) => {
    if (err) {
      return next(err);
    }
    if (!user) {
      return res.redirect("/login");
    }
    req.logIn(user, (err) => {
      if (err) {
        return next(err);
      }
      const returnTo = req.session.returnTo;
      delete req.session.returnTo;
      res.redirect(returnTo || "http://localhost:4200/register");
    });
  })(req, res, next);
});

router.get("/logout", (req, res) => {
  req.logOut();

  let returnTo = req.protocol + "://" + req.hostname;
  const port = req.connection.localPort;

  if (port !== undefined && port !== 80 && port !== 443) {
    returnTo = `${returnTo}:${port}/`;
  }

  const logoutURL = new URL(`https://${domain}/v2/logout`);

  const searchString = querystring.stringify({
    client_id: clientId,
    returnTo: returnTo,
  });
  logoutURL.search = searchString;

  console.log(logoutURL);
  res.redirect(logoutURL);
});

module.exports = router;

const express = require("express");
const cors = require("cors")
const path = require("path");

const expressSession = require("express-session");
const passport = require("passport");
const Auth0Strategy = require("passport-auth0");

const authRouter = require("./auth");
const authConfig = require("./auth_config.json")

const app = express();
const port = "8000";

const session = {
    secret: authConfig.sessionSecret,
    cookie: {},
    resave: false,
    saveUninitialized: false
};

if (app.get("env") === "production") {
    session.cookie.secure = true;
}

app.use(cors({origin: '*'}));
app.use(expressSession(session));

const strategy = new Auth0Strategy(
    {
      domain: authConfig.domain,
      clientID: authConfig.clientId,
      clientSecret: authConfig.clientSecret,
      callbackURL: authConfig.callbackUrl
    },
    function(accessToken, refreshToken, extraParams, profile, done) {
      /**
       * Access tokens are used to authorize users to an API
       * (resource server)
       * accessToken is the token to call the Auth0 API
       * or a secured third-party API
       * extraParams.id_token has the JSON Web Token
       * profile has all the information from the user
       */
      return done(null, profile);
    }
);

passport.use(strategy);
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => {
    done(null, user);
});

passport.deserializeUser((user, done) => {
    done(null, user);
});

app.use((req, res, next) => {
    res.locals.isAuthenticated = req.isAuthenticated();
    next();
});

app.use("/", authRouter);

app.listen(port);

console.log('App running at ' + port)
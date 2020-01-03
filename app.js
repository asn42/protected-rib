var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var session = require("express-session");
var FileStore = require('session-file-store')(session);
var bodyParser = require("body-parser");

var passport = require('passport');
var FortyTwoStrategy = require('passport-42').Strategy;

passport.use(new FortyTwoStrategy({
  clientID: process.env.FORTYTWO_CLIENT_ID,
  clientSecret: process.env.FORTYTWO_CLIENT_SECRET,
  callbackURL: 'https://rib.sansnom.org/login'
},
function(accessToken, refreshToken, profile, cb) {
  return cb(null, profile);
}));

passport.serializeUser(function(user, cb) {
  cb(null, user);
});

passport.deserializeUser(function(obj, cb) {
  cb(null, obj);
});

var app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  store: new FileStore,
  secret: process.env.SESSION_SECRET,
  resave: true,
  saveUninitialized: true
}));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(passport.initialize());
app.use(passport.session());

[
  {path: '/', file: 'asn-rib.html'},
  {path: '/asn-rib.pdf', file: 'asn-rib.pdf'}
].forEach((route) => {
app.get(route.path, 
  function(req, res) {
    if (!req.isAuthenticated || !req.isAuthenticated()) {
      req.session.returnTo = route.path;
      res.redirect('/login');
    } else {
      res.sendFile(route.file, {root:__dirname + '/protected/'});
    }
  });
});

app.get(
  '/login',
  passport.authenticate('42',
    {
      failureRedirect: '/login'
    }),
  function (req, res) {
    let returnTo = req.session.returnTo;
    res.redirect(returnTo);
  }
);

module.exports = app;

const models = require('../models');
const passport = require('passport');
const FacebookStrategy = require('passport-facebook').Strategy;
const FacebookTokenStrategy = require('passport-facebook-token');

module.exports = (server) => {
  server.use(passport.initialize());
  server.use(passport.session());

  server.all('*', (req, res, next) => {
    if (req.isAuthenticated()) {
      req.headers.authorization = `Bearer ${req.user.dataValues.accessToken}`;
    }
    next();
  });

  passport.serializeUser((user, done) => {
    done(null, user.facebookId);
  });

  passport.deserializeUser((id, done) => {
    models.User.findById(id)
    .then((user) => {
      done(null, user);
    })
    .catch((error) => {
      done(error);
    });
  });

  function updateUserCallback(accessToken, refreshToken, profile, done) {
    models.User.findOrCreate({ where: { facebookId: profile.id } })
      .spread((user) => {
        user.update({
          accessToken,
          cover: profile._json.cover.source,
          picture: profile._json.picture.data.url,
          name: `${profile.name.givenName} ${profile.name.familyName}`,
        })
        .then(() => {
          done(null, user);
        })
        .catch((error) => {
          done(error);
        });
      })
      .catch((error) => {
        done(error);
      });
  }

  passport.use(new FacebookStrategy(
    {
      clientID: process.env.FB_APP_ID,
      clientSecret: process.env.FB_APP_SECRET,
      callbackURL: '/auth/facebook/callback',
      profileFields: [
        'id',
        'cover',
        'email',
        'gender',
        'interested_in',
        'name',
        'picture.type(large)',
        'relationship_status',
      ],
    },
    updateUserCallback
  ));


  passport.use(new FacebookTokenStrategy(
    {
      clientID: process.env.FB_APP_ID,
      clientSecret: process.env.FB_APP_SECRET,
      profileFields: [
        'id',
        'cover',
        'email',
        'gender',
        'interested_in',
        'name',
        'picture.type(large)',
        'relationship_status',
      ],
    },
    updateUserCallback
  ));
};

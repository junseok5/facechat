module.exports = function(conn, passport, FacebookStrategy){
  var express = require('express');
  var route = express.Router();

  /* Passport-facebook routes */
  route.get('/auth/facebook', passport.authenticate('facebook', { scope: ['email'] }));

  route.get('/auth/facebook/callback', passport.authenticate('facebook',{
    successRedirect: '/', failureRedirect: '/login_fail'
  }));


  route.get('/logout', function(req, res){
    req.logout();
    res.redirect('/');
  });

    // serialize 인증 후 사용자 정보를 세션에 저장
  passport.serializeUser(function(user, done){
    console.log('serialize');
    console.log(done(null, user));
  });

  // deserialize 인증 후, 사용자 정보를 세션에서 읽어서 request.user에 저장
  passport.deserializeUser(function(user, done){
    console.log('deserialize');
    done(null, user);
  });

  /* Passport-facebook setting */
  passport.use(new FacebookStrategy({
      clientID: '1726723337618733',
      clientSecret: '93882f7db624b9922348605ca4bf32c9', //Secret Number
      callbackURL: "/auth/facebook/callback",
      profileFields: ['id', 'displayName', ,'gender', 'link', 'photos', 'email']
    },
    function(accessToken, refreshToken, profile, done) {
        console.log(profile);
        done(null, profile);
        var sql = 'select authId from user_info where authId=?';
        conn.query(sql, [profile.id], function(err, results, fields){
          if(err){
            console.log(err);
            res.status(500).send('Internal database server error(select error)');
          } else if(!results[0]){   // DB에 유저 정보가 존재하지 않을 때 (= 신규 유저일 떄)
            var newUser = {
              'authId': profile.id,
              'displayName': profile.displayName,
              'gender': profile.gender,
              'profileUrl': profile.profileUrl,
              'email': profile.emails[0].value,
              'photos': profile.photos[0].value
            };
            var sql = 'insert into user_info (authId, displayName, gender, profileUrl, email, photos, date) values(?, ?, ?, ?, ?, ?, NOW())';
            conn.query(sql, [newUser.authId, newUser.displayName, newUser.gender, newUser.profileUrl, newUser.email, newUser.photos], function(err, results, fields){
              if(err){
                console.log('internal server error: '+err);
              } else {
                console.log('success user_info insert!');
                conn.query('select * from user_info', function(error, result){
                  console.log(result);
                });
              }
            });

          } else {
            console.log('Already exist user!');
          }
      });
    }
  ));

  return route;
};

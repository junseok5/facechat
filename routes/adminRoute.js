module.exports = function(conn){
  var express = require('express');
  var route = express.Router();

  // admin page route
  route.get('/myadmin', function(req, res){
    if(req.user && req.user.id === '410648355935803') {
      conn.query('select * from user_info order by date asc', function(err, userinfo){
        if(err) console.log(err);
        conn.query('select a.displayName, a.profileUrl, a.photos, b.num, b.from_id, b.to_id, b.repo_class, b.date from user_info as a INNER JOIN user_report as b ON a.authId=b.to_id', function(err2, userrepo){
          if(err2) console.log(err2);
          conn.query('select * from user_chat order by date asc', function(err3, userchat){
            if(err3) console.log(err3);
            conn.query('select * from stopuser order by date asc', function(err4, stopuser){
              if(err4) console.log(err4);
              res.render('admin', {userinfo: userinfo, userrepo: userrepo, userchat: userchat, stopuser: stopuser});
            });
          });
        });
      });
    } else {
      res.render('error');
    }
  });

  return route;
};

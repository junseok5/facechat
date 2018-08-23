module.exports = function(conn){
  var express = require('express');
  var route = express.Router();

  // index page route
  route.get('/', function(req, res) {
    // not on login
    if(!req.user){
      res.render('index');
    // on login
    } else {
      // index page render
      // var sql = 'select gender from user_info where authId =?';
      // conn.query(sql,[req.user.id], function(err, rows){
      //   console.log("***"+rows[0].gender);
      //   if(rows[0].gender) {  // 성별이 저장되어 있다면
          res.render('index', {
            id: req.user.id,
            displayName: req.user.displayName,
            photos : req.user.photos[0].value,
            profileUrl : req.user.profileUrl
          });
        // } else {  // 성별이 저장되어 있지 않다면
        //   res.render('addInfo', {
        //     id: req.user.id
        //   });
        // }
      }
  });

  // chat page route
  route.get('/chat', function(req, res){
      // 로그인 되어 있다면
      if(req.user){
        var sql = 'select * from stopuser';
        conn.query(sql, function(err, stopuser){
          if(err) console.log(err);
          if(stopuser.length === 0) {
            res.render('chat', {
              id: req.user.id,
              displayName: req.user.displayName,
              photos : req.user.photos[0].value,
              profileUrl : req.user.profileUrl
            });
            // ip 정의
            var ip = req.headers['x-forwarded-for'] ||
            req.connection.remoteAddress ||
            req.socket.remoteAddress ||
            req.connection.socket.remoteAddress;
            console.log('ip: '+ip);
            var sql = 'insert into user_ip (authId, date, ipadress) values(?, NOW(), ?)';
            conn.query(sql, [req.user.id, ip]);

          } else {
          for(var i=0;i<stopuser.length;i++){
            if(stopuser[i].authId !== req.user.id) {
              res.render('chat', {
                id: req.user.id,
                displayName: req.user.displayName,
                photos : req.user.photos[0].value,
                profileUrl : req.user.profileUrl
              });
              // ip 정의
              var ip = req.headers['x-forwarded-for'] ||
              req.connection.remoteAddress ||
              req.socket.remoteAddress ||
              req.connection.socket.remoteAddress;
              console.log('ip: '+ip);
              var sql = 'insert into user_ip (authId, date, ipadress) values(?, NOW(), ?)';
              conn.query(sql, [req.user.id, ip]);
            } else {
              res.render('stopUser', {
                date: stopuser[i].date,
                term: stopuser[i].stop_term
              });
            }
          }
        }
        });
    } else {  // 로그인 되어 있지 않다몀ㄴ
      res.render('index');
    }
  });
  // login fail page route
  route.get('/login_fail', function(req, res){
      res.render('login_fail');
  });

  return route;
};

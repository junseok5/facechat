module.exports = function(conn, io){
  var express = require('express');
  var route = express.Router();

  /******************************************************
          socket.io를 이용한 채팅 소스
  ******************************************************/
  var rooms = {};   // 유저 : 방 이름
  var queue = [];   // 대기 유저
  //var allUsers = {}; // 모든 유저들의 소켓 정보
  var otherUser = {}; // 나의 소켓 -> 상대 소켓, 상대 소켓 -> 나의 소켓 저장
  var socketCount = 0;  // 현재 접속자 수


  io.sockets.on('connection', function(socket){
      // 접속완료를 알림.
      socket.emit('connected');
      //allUsers[socket.id] = socket;
      socketCount++;

      // chat요청을 할 시
      socket.on('requestRandomChat', function(data){
          console.log('requestRandomChat');

          if(queue[0] || queue[1]){   // queue에 대기 유저가 있는지 확인
            var other = queue.pop();    // queue에 대기 유저를 제거함과 대기 유저의 socket 값을 other변수에 저장
            otherUser[socket.id] = other;
            console.log("here  "+ otherUser[socket.id].id + "    here2"+socket.id);
            var room = socket.id + '#' + other.id;
            other.join(room);   // 대기 유저 방에 접속
            socket.join(room);  // 자신이 방에 접속
            rooms[other.id] = room;
            rooms[socket.id] = room;  // rooms에 저장된 방의 이름을 같게 함으로써 두명 동시에 통제 가능
            io.sockets.in(room).emit('completeMatch');
            console.log('completeMatch!');
            return;
          } else {
          // 빈방이 없으면 혼자 방만들고 기다림.
          console.log('make a room');
          queue.push(socket);
        }
      });

      // 요청 취소 시



      socket.on('cancelRequest', function(data){
          console.log('cancelRequest');
          queue.pop();
          var room = rooms[socket.id];
          socket.leave(room);
      });

      // 대화 도중 나가기
      socket.on('chat out', function(data){
        console.log('chat_out');
        var room = rooms[socket.id];
        io.sockets.in(room).emit('chat end');
      });

      // client -> server Message전송 시
      socket.on('sendMessage', function(data){
          var room = rooms[socket.id];
          console.log('sendMessage!');
          io.sockets.in(room).emit('receiveMessage', data);
      });

      // 방에서 내보내기
      socket.on('room out', function(data){
        console.log('room out');
        var room = rooms[socket.id];
        socket.leave(room);
      });

      // chat db 저장
      socket.on('save chat', function(data){
        console.log('add chat');
        var sql = 'insert into user_chat (from_id, to_id, content, date) values(?, ?, ?, NOW())';
        conn.query(sql, [data.myid, data.otherid, data.message], function(err, results){
          if(err) {
            console.log('internal server error: '+err);
          } else {
            console.log('message save!');
          }
        });
      });

      // 신고 내용 db에 저장
      socket.on('save report', function(data){
        console.log('save report');
        var sql = 'insert into user_report (from_id, to_id, repo_class, date) values(?, ?, ?, NOW())';
        conn.query(sql, [data.myid, data.otherid, data.repo_val], function(err, results){
          if(err) {
            console.log('internal server error: '+err);
          } else {
            console.log('save report!');
          }
        });
      });

      // Current User Number
      socket.on('current user', function(){
        console.log('current user');
        socket.emit('current user', {socketCount: socketCount});
      });

      // Today User
      socket.on('today user', function(data){
        console.log('today user');
        var sql ='select a.displayName, a.profileUrl, a.photos, a.gender, b.date from user_info as a INNER JOIN user_ip as b USING(authId) where b.date like "'+data.year+'-'+data.month+'-'+data.date+'%"';
        conn.query(sql, function(err, rows){
          if(err) console.log(err);
          socket.emit('today user', {rows: rows});
        });
      });

      // Reported User Chat List
      socket.on('report chatlist', function(data){
        console.log('report chatlist');
        var sql = 'select displayName, profileUrl, photos from user_info where authId = ?';
        conn.query(sql, [data.from_id], function(err, rows){
          if(err) console.log(err);
          conn.query(sql, [data.to_id], function(err, rows2){
            if(err) console.log(err);
            var sql = 'select content, date from user_chat where from_id = ? and to_id = ? order by date asc';
            conn.query(sql, [data.from_id, data.to_id], function(err, rows3){
              if(err) console.log(err);
              conn.query(sql, [data.to_id, data.from_id], function(err, rows4){
                if(err) console.log(err);
                socket.emit('report chatlist', {from_profile: rows, to_profile: rows2, from_chat: rows3, to_chat: rows4});
              });
            });
          });
        });
      });

      // delete report user in repo db
      socket.on('delete report', function(data){
        console.log('delete report');
        var sql = 'delete from user_report where num = ?';
        conn.query(sql, [data.num], function(err, rows){
          if(err) console.log(err);
        });
      });

      // stop user
      socket.on('stop user', function(data){
        console.log('stop user');
        var sql = 'insert into stopuser (authId, repo_class, stop_term, date) values(?,?,?,NOW())';
        conn.query(sql, [data.authId, data.repo_class, data.term], function(err, rows){
          if(err) console.log(err);
        });
        var sql = 'delete from user_report where num = ?';
        conn.query(sql, [data.repo_num], function(err, rows){
          if(err) console.log(err);
        });
      });

      // 신고 풀어주기
      socket.on('release user', function(data){
        console.log('release user');
        var sql = 'delete from stopuser where num = ?';
        conn.query(sql, [data.num], function(err, rows){
          if(err) console.log(err);
        });
      });

      // 성별 받기
      socket.on('gender save', function(data){
        console.log('gender save');
        var sql = 'update user_info set gender=? where authId=?';
        conn.query(sql, [data.gender, data.authId], function(err){
          if(err) console.log(err);
        });
        socket.emit('gender receive');
      });

      // 이번달, 오늘 가입자
      socket.on('date register', function(data){
        console.log('date register');
        var sql = 'select * from user_info where date >= "?-?-1" and date <= "?-?-30"';
        conn.query(sql, [data.year, data.month, data.year, data.month], function(err, rows){
          if(err) console.log(err);
          var sql2 = 'select * from user_info where date > CURRENT_DATE()';
          conn.query(sql2, function(err2, rows2){
            if(err2) console.log(err2);
            socket.emit('date register', {monthR: rows, dayR: rows2});
          });
        });
      });

      // disconnect
      socket.on('disconnect', function(data){
          console.log("disconnect");
          if(queue) queue.pop();
          var room = rooms[socket.id];
          socketCount--;
          io.sockets.in(room).emit('chat end');
      });
  });

  return route;
}

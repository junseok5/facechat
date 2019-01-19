var express = require('express')
var http = require('http')
var app = express()
var server = http.createServer(app)
var io = require('socket.io').listen(server)
var requestIp = require('request-ip')

var session = require('express-session')
var passport = require('passport')
var mysql = require('mysql')
var FacebookStrategy = require('passport-facebook').Strategy

// Mysql Connection
var conn = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'facechat',
  charset: 'utf8'
})

// Mysql Error Handling
conn.connect(function (err) {
  if (err) console.log(err)
})
// Mysql Set Encoding
conn.query('set names utf8', function (error, result, fields) {
  if (error) throw error
  console.log('set names ok!')
})

// Set Session
app.use(
  session({
    secret: '',
    resave: false,
    name: 'sessionId',
    saveUninitialized: false
  })
)

app.use(passport.initialize())
app.use(passport.session())
app.use(express.static(__dirname + '/public'))

app.set('view engine', 'ejs')
app.set('views', __dirname + '/views')
app.engine('html', require('ejs').renderFile)

/*******************************************
                  Route Start
********************************************/
// User Page Route
var userRoute = require('./routes/userRoute')(conn)
app.use('/', userRoute)

// Admin Page Route
var adminRoute = require('./routes/adminRoute')(conn)
app.use('/', adminRoute)

// Facebook Connection Route
var fbRoute = require('./routes/facebookRoute')(
  conn,
  passport,
  FacebookStrategy
)
app.use('/', fbRoute)

// Socket Route
var socketRoute = require('./routes/socketRoute')(conn, io)
app.use('/', socketRoute)

/*******************************************
                  Route End
********************************************/

/* Server listening */
server.listen(3000, function () {
  console.log('Connected 3000 port!')
})

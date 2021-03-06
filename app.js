var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var fileupload=require('express-fileupload');
require('dotenv').config()
const hbs = require('hbs')

var userRouter = require('./routes/user');
var adminRouter = require('./routes/admin');

var app = express();
var db=require('./config/connections')    
var session=require('express-session')
var MongoDBStore = require('connect-mongodb-session')(session);

var store = new MongoDBStore({
  uri: 'mongodb+srv://Fasilzaman:Prg3NjzRlwR2WCRW@cluster0.bdpsf.mongodb.net/carzy?retryWrites=true&w=majority/carzy',
  collection: 'carzySession'
});

store.on('error', function(error) {
  console.log("====================================================================");
  // console.log("database session error",error);
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');
hbs.registerHelper('ifEquals',function(arg1, arg2, options){
  return (arg1 == arg2) ? options.fn(this) : options.inverse(this);
});
hbs.registerHelper("inc", function(value, options)
{
    return parseInt(value) + 1;
});
hbs.registerPartials(__dirname + '/views/partials', function (err) {});

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(fileupload())

db.connect((err)=>{
  if(err){
    console.log("error occured");
  }else{
    console.log("Data base connected");
  }
  
})
app.use(session({secret:"key",cookie:{maxAge:6000000,sameSite:'lax'},store: store,resave: true,saveUninitialized: true})) 
app.use(function(req, res, next) { res.header('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0'); next(); });

app.use('/', userRouter);
app.use('/admin', adminRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;

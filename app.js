require('dotenv').config();
const createError  = require('http-errors');
const express      = require('express');
const path         = require('path');
const cookieParser = require('cookie-parser');
const session      = require('express-session');
const logger       = require('morgan');
const indexRouter  = require('./routes/index');
const restRouter   = require('./routes/restRouter');
const app          = express();
const mongoose     = require('mongoose');
const helmet       = require("helmet");

//CONNECT TO DATBASE
const uri = process.env.MONGO_URI;
mongoose.connect(uri);
const database = mongoose.connection;
database.on('error', (error) => {
  console.log(error)
})
database.once('connected', () => {
  console.log('Database Connected');
})

// View Engine
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(helmet());
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use(session({ 
  secret: process.env.SESSION_SECREAT, 
  cookie: { maxAge: 60 * 1000 }, 
  resave: false,
  saveUninitialized: true 
}));

app.use(express.static(path.join(__dirname, 'public')));
app.use('/css', express.static(path.join(__dirname, 'public/css')));
app.use('/fonts', express.static(path.join(__dirname, 'public/fonts')));
app.use('/images', express.static(path.join(__dirname, 'public/images')));
app.use('/js', express.static(path.join(__dirname, 'public/js')));
app.use('/profile',express.static(path.join(__dirname, 'public/drivers')));

app.use('/', indexRouter);
app.use('/api', restRouter);

const swaggerUIPath       = require("swagger-ui-express");
const swaggerjsonFilePath = require("./docs/swagger.json");
app.use("/api-docs", swaggerUIPath.serve, swaggerUIPath.setup(swaggerjsonFilePath));

// Catch 404 And Forward To Error Handler
app.use(function(req, res, next) {
  next(createError(404));
});

// Error Handler
app.use(function(err, req, res, next) {
  // Set Locals, Only Providing Error In Development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // Render The Error Page
  res.status(err.status || 500);
  res.render('error');
});

app.listen(7001, () => {
  console.log(`Server listing on: 7001`);
})


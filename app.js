const express = require('express');
const path = require('path');
const logger = require('morgan');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const passport = require('passport');
const flash = require('connect-flash');
const mongoose = require('mongoose');
// const ejs = require('ejs');

var setUpPassport = require("./setuppassport");
var routes = require('./routes');

var app = express();
// mongoose.connect("mongodb://localhost:27017/mini");
const db = process.env.MONGOLAB_URI || 'mongodb://localhost:27017/mini';
mongoose.connect("mongodb://localhost:27017/mini");
setUpPassport();

const port = process.env.PORT || 3000;

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(express.static(path.join(__dirname, "public")));

app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

app.use(session({
  secret: "LUp$Dg?,I#i&owP3=9su+OB%`JgL4muLF5YJ~{;t",
  resave: true,
  saveUninitialized: true
}));

app.use(flash());

app.use(passport.initialize());
app.use(passport.session());

app.use(routes);

app.listen(port, function(){
  console.log('server running on port'+port);
});

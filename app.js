const express = require('express');
var multer  = require('multer');
const path = require('path');
const logger = require('morgan');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const passport = require('passport');
const flash = require('connect-flash');
const mongoose = require('mongoose');
const busboy = require('connect-busboy');
const moment = require('moment');
// const fs = require('fs');
// const ejs = require('ejs');

var setUpPassport = require("./setuppassport");
var routes = require('./routes');
var upload = multer({ dest: 'public/' });
var app = express();
// app.use(moment);
app.use(bodyParser.urlencoded({ extended: false }));
// mongoose.connect("mongodb://localhost:27017/mini");
const db = process.env.MONGOLAB_URI || 'mongodb://localhost:27017/mini';
mongoose.connect("mongodb://localhost:27017/mini");
setUpPassport();
// app.use(upload);
const port = process.env.PORT || 3000;

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(express.static(path.join(__dirname, "public")));

app.use(busboy());
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

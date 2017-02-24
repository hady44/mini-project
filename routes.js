const express = require('express');
const passport = require('passport');
const fs = require('fs');

var User = require("./models/user");
const router = express.Router();

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    next();
  } else {
    req.flash("info", "You must be logged in to see this page.");
    res.redirect("/login");
  }
}

router.use(function(req, res, next) {//initializing vars to bee seen by other fles
  res.locals.currentUser = req.user;
  res.locals.errors = req.flash("error");
  res.locals.infos = req.flash("info");
  next();
});

router.get("/", function(req, res, next) {
  // log
  User.find()
  .sort({ createdAt: "descending" })
  .exec(function(err, users) {
    if (err) { return next(err); }
    res.render("index", { users: users });
  });
});


//login
router.get('/login',function(req,res){
  res.render("login");
});

router.post('/login',
  passport.authenticate('login', {
    successRedirect: '/',
     failureRedirect: '/login',
    failureFlash: true}));

router.get('/signup',function(req, res){
  res.render("signup");
});

router.post('/signup',function(req, res ,next){
  var username = req.body.username;
  var password = req.body.password;
  User.findOne({username: username}, function(err, user){
    if(err){return next(err);}
    if(user){
      req.flash("error","user already exists");
      return res.redirect("/signup");
    }
    var newUser = new User({
      username: username,
      password:password
    });
    newUser.save(next);
  });
}, passport.authenticate("login",{
  successRedirect:"/",
  failureRedirect:"/signup",
  failureFlash:true
}));

router.get('/logout', function(req, res){
  req.logout();
  res.redirect('/');
});

router.get('/users/:username',function(req, res, next){
  const username = req.params.username;
  User.findOne({username:username}, function(err,user){
    if(err){return next(err);}
    if(!user){
      return next(404);
    }
    res.render("profile",{user:user});
  });
  // res.render("profile");
});

router.get("/edit", ensureAuthenticated , function(req, res){
  res.render("edit");
});

router.post('/edit',ensureAuthenticated, function(req, res, next){
  req.user.displayName = req.body.displayName;
  req.user.bio = req.body.bio;
  req.user.save(function(err){
    if(err){return next(err);}
    req.flash("info","profile updated");
    res.redirect("/edit");
  });
});

router.post('/Upload', function(req, res) {
    var fstream;
    req.pipe(req.busboy);
    req.busboy.on('file', function (fieldname, file, filename) {
        console.log("Uploading: " + filename);
        fstream = fs.createWriteStream(__dirname + '/public/' + filename);
        req.user.works.push(filename);
        req.user.save(function(err){
          if(err) {return next(err);}
          req.flash("info","work uploaded");
        });
        file.pipe(fstream);
        fstream.on('close', function () {
            res.redirect('back');
        });
    });
});

module.exports = router;

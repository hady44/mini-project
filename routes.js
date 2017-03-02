const express = require('express');
const multer = require('multer');
const passport = require('passport');
const fs = require('fs');
var Project = require("./models/project")
var User = require("./models/user");
const crypto = require('crypto');
const path = require('path');
const moment = require('moment');
const router = express.Router();
// var upload = multer({ dest: 'public/' });

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './public/');
    },
    filename: function (req, file, cb) {
        const buf = crypto.randomBytes(48);
        cb(null, Date.now() + buf.toString('hex') + path.extname(file.originalname));
    }
});


const upload = multer({
    storage: storage
});


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

//TODO:fix the pagination




//login
router.get('/login',function(req,res){
  res.render("login");
});

router.post('/login',
  passport.authenticate('login', {
    successRedirect: '/',
     failureRedirect: '/login',
    failureFlash: true}));
//singup



router.get('/signup',function(req, res){
  if(req.user){
    res.status(401);
    res.render("401 ");
  }
  else {
    res.render("signup");
  }
});


router.post('/signup', upload.single('avatar') ,function(req, res ,next){

  var username = req.body.username;
  var password = req.body.password;

  var profilePicture = req.file;

  User.findOne({username: username}, function(err, user){
    if(err){return next(err);}
    if(user){
      req.flash("error","user already exists");
      return res.redirect("/signup");
    }

    var newUser = new User({
      username: username,
      password:password,
      profilePicture: profilePicture ? profilePicture.filename:'default.png',
      createdAt:moment().format('MM/DD/YYYY')
    });
    // console.log(profilePicture.filename);
// if (typeof myVar != 'undefined')
// console.log(req.body.file);


    newUser.save(next);
  });

}, passport.authenticate("login",{
  successRedirect:"/",
  failureRedirect:"/signup",
  failureFlash:true
}));
//logout
router.get('/logout', function(req, res){
  req.logout();
  res.redirect('/');
});
//profiles
router.get('/users/:username',function(req, res, next){
  const username = req.params.username;
  User.findOne({username:username}, function(err,user){
    if(err){return next(err);}
    if(!user){
      return next(404);
    }
    Project.find({createdBy:req.params.username})
    .sort({ createdAt: "descending" })
    .exec(function(err, projects) {
      if (err) { return next(err); }
      res.render("profile", { projects: projects, user:user });
    });
    // res.render("profile",{user:user});
  });
  // res.render("profile");
});

//edit
router.post('/edit',ensureAuthenticated, function(req, res, next){
  req.user.displayName = req.body.displayName;
  req.user.bio = req.body.bio;
  req.user.save(function(err){
    if(err){return next(err);}
    req.flash("info","profile updated");
    res.redirect("/edit");
  });

});
//uploading new project
router.post('/newProject', ensureAuthenticated,  upload.single('displayImage') ,function(req, res,next) {
  // console.log(2);
  // console.log(typeof req.body.URL);
  if((typeof(req.body.URL) == undefined || req.body.URL.length <7 || !req.body.URL)  && !req.file){
    console.log('hi');
    req.flash("error","please provide either a valid repo , a picture or both");
    return res.redirect("/newProject");
  }
  var newProject = new Project({
    title: req.body.title,
    //TODO:fix url
    URL:   '/project/'+req.body.title,
    createdBy:req.user.username,
    description: req.body.Description,
    repo: req.body.URL,
    img: req.file?req.file.filename:undefined
  });

  var filename = req.file? req.file.filename:undefined;
  req.user.works.push(req.body.title);
  console.log(req.body.title);
  req.user.save(function(err){
    if(err) {return next(err);}
    req.flash("info","project uploaded");

  });

  newProject.save();

  // req.flash("info","project uploaded");
  res.redirect("/edit");

});
//TODO:delete everything related to the separate page previously used for uploading screenshots
//An option for adding a screenshot

// router.get('/pic',ensureAuthenticated,function(req,res){
//   res.render("screenshot");
// });

// router.post('/pic', ensureAuthenticated ,function(req, res, next){
//   var fstream;
//   var fp;
//   req.pipe(req.busboy);
//   console.log(2);
//   req.busboy.on('file', function (fieldname, file, filename) {
//     console.log(file);
//
//
//   });
// });

router.get('/newProject', ensureAuthenticated ,function(req, res) {
  // console.log(2);
  res.render("newProject");
});

router.get("/edit",ensureAuthenticated, function(req, res, next) {
  // log
  Project.find({createdBy:req.user.username})
  .sort({ createdAt: "descending" })
  .exec(function(err, projects) {
    if (err) { return next(err); }
    res.render("edit", { projects: projects });
  });
});

router.get("/project/:projectName",function(req, res, next){
  var title = req.params.projectName;
  var proj;
  Project.findOne({title:title},function(err, project){
    if(err){return res.redirect("back");}
    // console.log(project.createdBy);
    proj = project;
    if(proj === null)
    {
      return res.redirect("back");
    }
    console.log(proj.img);
    var creator = proj.createdBy;
    User.findOne({username: creator},function(err, user){
      // if(err){console.log('invalid user'); return next(err);}
        return res.render("work",{user:user, project: project});
    });
  });


});

router.get("/:num", function(req, res, next) {
  // log
  var num = req.params.num;
  var cnt = 0;
  var total = [];
  // console.log('user count is'+User.count());


  User.find()
  .sort({ createdAt: "ascending" })
  .exec(function(err, users) {
    if (err) { return next(err); }
    var left = users.length;
    if(users.length == 0)
    {
      // cnt = Math.ceil(total.length/10);
      return res.render("index", { projects: total, count : cnt, num:num });

    }
    for (var i = 0; i < users.length ; i++) {
      // console.log(users[i].username);
      Project.find({createdBy:users[i].username}).sort({createdAt:"ascending"}).skip(num-1).limit(2).exec(function(err,projects){
        if(err){return next(err);}
        left--;
        // total = total.concat(projects);
        for (var i = 0; i < projects.length; i++) {
          total.push(projects[i]);
        }
        // console.log(total.length);
        for (var i = 0; i < total.length; i++) {
          console.log(total[i].createdBy);
        }
        if(left === 0)
        {
          cnt = Math.ceil(total.length/10);

          res.render("index", { projects: total, count : cnt, num:num });
        }
      });
    }
    // console.log(total.length);

  });
});

router.get("/", function(req, res, next) {
  // log
  var num =1;
  num = num?num:1;
  var cnt = 0;
  var total = [];
  // console.log('user count is'+User.count());


  User.find()
  .sort({ createdAt: "ascending" })
  .exec(function(err, users) {
    if (err) { return next(err); }
    var left = users.length;
    if(users.length == 0)
    {
      // cnt = Math.ceil(total.length/10);
      return res.render("index", { projects: total, count : cnt, num:num });

    }
    for (var i = 0; i < users.length ; i++) {
      // console.log(users[i].username);
      Project.find({createdBy:users[i].username}).sort({createdAt:"ascending"}).skip(num-1).limit(2).exec(function(err,projects){
        if(err){return next(err);}
        left--;
        // total = total.concat(projects);
        for (var i = 0; i < projects.length; i++) {
          total.push(projects[i]);
        }
        // console.log(total.length);
        for (var i = 0; i < total.length; i++) {
          console.log(total[i].createdBy);
        }
        if(left === 0)
        {
          cnt = Math.ceil(total.length/10);

          res.render("index", { projects: total, count : cnt, num:num });
        }
      });
    }
    // console.log(total.length);

  });

});
//TODO:restrict access to login and signup

module.exports = router;

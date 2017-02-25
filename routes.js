const express = require('express');
const passport = require('passport');
const fs = require('fs');
var Project = require("./models/project")
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
  Project.find()
  .sort({ createdAt: "descending" })
  .exec(function(err, projects) {
    if (err) { return next(err); }
    res.render("index", { projects: projects });
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


router.post('/edit',ensureAuthenticated, function(req, res, next){
  req.user.displayName = req.body.displayName;
  req.user.bio = req.body.bio;
  req.user.save(function(err){
    if(err){return next(err);}
    req.flash("info","profile updated");
    res.redirect("/edit");
  });

});

router.post('/newProject', ensureAuthenticated ,function(req, res,next) {
  // console.log(2);
  var newProject = new Project({
    title: req.body.title,
    //TODO:fix url
    URL:   '/project/'+req.body.title,
    createdBy:req.user.username,
    description: req.body.Description,
    repo: req.body.URL
  });
  newProject.save();

  // req.flash("info","project uploaded");
  res.redirect("/pic");

});

router.get('/pic',ensureAuthenticated,function(req,res){
  res.render("screenshot");
});

router.post('/pic', ensureAuthenticated ,function(req, res, next){
  var fstream;
  var fp;
  req.pipe(req.busboy);
  console.log(2);
  req.busboy.on('file', function (fieldname, file, filename) {

      fp =  filename;
      console.log("Uploading: " + filename);
      fstream = fs.createWriteStream(__dirname + '/public/' + filename);
      req.user.works.push(filename);
      req.user.save(function(err){
        if(err) {return next(err);}
        req.flash("info","project uploaded");
        Project.find({createdBy: req.user.username})
        .sort({ createdAt: "descending" })
        .exec(function(err, projects) {
          if (err) { return next(err); }
          // res.render("index", { projects: projects });
          projects[0].img = fp;
          projects[0].save();
          console.log(projects[0].createdBy);
          // console.log();
        });
      });

      file.pipe(fstream);
      fstream.on('close', function () {
          res.redirect('back');
      });

  });
});

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

module.exports = router;

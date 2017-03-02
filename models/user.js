//includes
const mongoose = require('mongoose');

var bcrypt = require("bcrypt-nodejs");

// connecing to db
// const db = process.env.MONGOLAB_URI || 'mongodb://localhost:27017/mini';
// var connection = mongoose.createConnection(db);

//initializing useful consts and vars
const SALT_FACTOR = 10;

//defining user schema
var userSchema = mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  createdAt: String,
  displayName: String,
  profilePicture: String,
  bio: String,
  works:{type: Array, default: []},
  
});


//displaying the displayName (or the username if the user has no displayName)

userSchema.methods.name = function(){
  return this.displayName || this.username;
};

//dumy function
var doMagic = function(){};

//TODO:hash the password using bcrypt && introduce presaving protocol
//ps:compare guessed password using bcrypt's compare method for secuirty

userSchema.pre("save",function(done){
  var user = this;
  if(!user.isModified("password")){
    return done();
  }
  bcrypt.genSalt(SALT_FACTOR,function(err,salt){
    if(err) {return done(err);}
    bcrypt.hash(user.password, salt, doMagic, function(err, hashedPassword){
      if(err){return done(err);}
      user.password = hashedPassword;
      done();
    });
  });
});


userSchema.methods.checkPassword = function(guess, done){
  bcrypt.compare(guess, this.password, function(err, isMatch){
  done(err, isMatch);
  });
};

var User = mongoose.model("User", userSchema);

module.exports = User;

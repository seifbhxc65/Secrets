//jshint esversion:6

require('dotenv').config()
//const md5=require('md5');
const session = require('express-session');
const passportLocalMongosse=require("passport-local-mongoose");
const passport=require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const express = require('express');
const bp = require('body-parser');
const findOrCreate = require('mongoose-findorcreate')
const { get } = require('request');
const app = express();
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(bp.urlencoded({ extended: true })); 
app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: false,
    
  }));
  app.use(passport.initialize());
    app.use(passport.session());

const mongoose = require('mongoose');


mongoose.connect('mongodb://localhost:27017/secretsDB',{useNewUrlParser:true});

const userSchema=new mongoose.Schema({
    username:String,
    password:String,
    googleId:String
});
userSchema.plugin(passportLocalMongosse);
userSchema.plugin(findOrCreate);
const User=mongoose.model('User',userSchema);
passport.use(User.createStrategy());
passport.serializeUser(function(user, done) {
    done(null, user);
  });
  
  passport.deserializeUser(function(user, done) {
    done(null, user);
  });
passport.use(new GoogleStrategy({
    clientID:  process.env.CLIENT_ID,
    clientSecret:process.env.CLIENT_SECRET ,
    callbackURL: "http://localhost:3000/auth/google/secret",
    userProfileURL:"https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
      console.log(profile);
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));
app.listen(3000, () => {
    let ch='hello';
    
    console.log(ch);
    console.log('port is open at 3000');
});
app.get('/', (req, res) => {
  //  console.log(eval('5+7'));
    res.render('home');
});

app.get('/login', (req, res) => {
    res.render('login');
});
app.get('/register', (req, res) => {
    res.render('register');
});
app.get('/secret',(req,res)=>{
if(req.isAuthenticated()){
    console.log('errrror');
    res.render('secrets');
}else{
    res.redirect('login');
}
});
app.post('/register', (req, res) => {
User.register({username:req.body.username},req.body.password,(err,user)=>{
    if(err){
        console.log(err);
        res.redirect('/register')
    }else{passport.authenticate("local")(req,res,()=>{
        res.redirect('/secret');
    })}
})
});

app.post('/login', (req, res) => {
    const user =new User({
        username:req.body.username, 
        password:req.body.password  });
    req.login(user,(err)=>{
        if(err){
            console.log(err);
            res.redirect('/login') ;       }
            else{
                passport.authenticate("local")(req,res,()=>{
                res.redirect('/secret');

            });
    }});

});
app.get('/logout', (req, res) => {
req.logout();
res.redirect('login');
});
app.get('/auth/google',
  passport.authenticate('google', { scope:
      [  'profile' ] }
));
app.get( '/auth/google/secret',
    passport.authenticate( 'google', {
        successRedirect: '/secret',
        failureRedirect: '/'
}));
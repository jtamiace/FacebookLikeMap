//dependencies for each module used
var auth = require('./auth.js');
var dotenv = require('dotenv');
var express = require('express');
var graph = require('fbgraph');
var http = require('http');
var path = require('path');
var handlebars = require('express3-handlebars');
var app = express();

//route files to load
var index = require('./routes/index');

//Configures the Template engine
app.engine('handlebars', handlebars());
app.set('view engine', 'handlebars');
app.set('views', __dirname + '/views');
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.bodyParser());

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});


app.configure('production', function(){
  app.use(express.errorHandler());
});

//routes
app.get('/', function (req,res) {
	res.render("index");
});

//fbgraph authentication
app.get('/auth/facebook', function(req, res) {
 
  // we don't have a code yet
  // so we'll redirect to the oauth dialog
  if (!req.query.code) {
    var authUrl = graph.getOauthUrl({
        "client_id":     process.env.fb_app_id
      , "redirect_uri":  'http://localhost:3000/auth/facebook'
      , "scope":         'user_likes, user_about_me, friends_likes, user_status, user_checkins'
    }); 

    if (!req.query.error) { //checks whether a user denied the app facebook login/permissions
       console.log("Access Granted");
      res.redirect(authUrl);
    } else {  //req.query.error == 'access_denied'
     
      console.log("Access Denied");
      res.send('access denied');
    }
    return;
      }

  // code is set
  // we'll send that and get the access token
  graph.authorize({
      "client_id":      process.env.fb_app_id
    , "redirect_uri":   'http://localhost:3000/auth/facebook'
    , "client_secret":  process.env.fb_app_secret
    , "code":           req.query.code
  }, function (err, facebookRes) {
  	console.log("after auth :" + JSON.stringify(facebookRes))
  	console.log("access token set :" + graph.getAccessToken())
    res.redirect('/UserHasLoggedIn');
  });  
});

var finishCounter = 0;
data = {};
data.mutualfriends = [];

function getMutualFriends(friend, res, cx, cy){
  graph.get('/me/mutualfriends/' + friend.id, function(err2, response2) {
    //console.log(err2);
    data.mutualfriends.push({"name": friend.name, "numfriends": ''+response2.data.length, "cx": cx, "cy": cy});
    //console.log(data.mutualfriends);

    finishCounter++;
    if(finishCounter === 25){
      res.json(data.mutualfriends);
    }
  });
}

app.get('/UserHasLoggedIn', function(req,res) {
  res.render('facebook', data);
})

app.get('/UserHasLoggedIn/default', function(req, res) {
	graph.get('me/friends', function(err, response) {
		//console.log(err);
    data.friends = response;
    //console.log(data.friends.data);

    var totalfriendcount = data.friends.data.length;
    //console.log("total friends: " + totalfriendcount);

    var cx = 0;
    var cy = 150;

    for (var i=0; i<25; i++){
      var index = Math.floor((Math.random()*totalfriendcount)); //get a random friend index
      //console.log("index: " + index);

      if(i%5 == 0){
        cx = 100;
        cy += 100;
      }else{
        cx += 100;
      }

      getMutualFriends(data.friends.data[index], res, cx, cy);
    }
	});
});


exports.graph = graph;



//set environment ports and start application
app.set('port', process.env.PORT || 3000);
http.createServer(app).listen(app.get('port'), function(){
	console.log('Express server listening on port ' + app.get('port'));
});
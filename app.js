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
      , "scope":         'likes'
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
      "client_id":      process.env.facebook_app_id
    , "redirect_uri":   'http://localhost:3000/auth/facebook'
    , "client_secret":  process.env.facebook_app_secret
    , "code":           req.query.code
  }, function (err, facebookRes) {
  	console.log("after auth :" + JSON.stringify(facebookRes))
  	console.log("access token set :" + graph.getAccessToken())
    res.redirect('/UserHasLogginIn');
  });

  
});

app.get('/UserHasLoggedIn', function(req, res) {
	graph.get('me', function(err, response) {
		console.log(err); //if there is an error this will return a value
		data = { facebookData: response};
		res.render('facebook', data);
	});
});

app.get('/me/likes', function(req,response){ 
  // get the likes that the user has
graph.get('/me/likes', function(err, res) {
  response.send(res);
  
})

});

exports.graph = graph;

app.get('/UserHasLoggedIn', function(req, res) {
  res.render("http://localhost:3000/", { title: "Logged In" });
});

//set environment ports and start application
app.set('port', process.env.PORT || 3000);
http.createServer(app).listen(app.get('port'), function(){
	console.log('Express server listening on port ' + app.get('port'));
});
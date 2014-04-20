//load environment variables
var dotenv = require('dotenv');
dotenv.load();
var graph = require('fbgraph');

var conf = {
	client_id: '1439777049602913'
	, client_secret: 'ec3e5bcd7dfc59ef1a4969ff11dc02da'
	, scope: 'read_stream'
	, redirect_uri: 'http://localhost:3000'
	};

	var authUrl = graph.getOauthUrl({
	"client_id": process.env.facebook_app_id
	, "client_secret": process.env.facebook_app_secret 
	, "redirect_uri": process.env.redirect_uri //change this to heroku website later in .env
});

exports.graph = graph;
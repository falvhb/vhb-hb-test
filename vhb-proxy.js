process.on('uncaughtException', function(err) {
  console.log('Caught exception: ', err.stack);
});

/** VHB Staff is forced to use interal proxy  */
var PROXY = process.env.proxystr; // ? 'http://proxy.vhb.de';

var express = require('express');
//var compress = require('compression');
var request = require('request-promise');
var fs = require('fs');

var helper = require('./vhb-proxy-helper/helper.js');


var params = []
process.argv.forEach(function (val, index, array) {
  if (index > 1){ params.push(val);}
});


var activeConfig = 'hb';
if (params[0]){
	activeConfig = params[0]
};

var CONFIG = {
	hb: {
		domain: 'handelsblatt.com',
		css: 'habla-redesign.css',
		port: 38110
	},
	wiwo: {
		domain: 'wiwo.de',
		css: 'wiwo.css',
		port: 38111
	}
};





function startServer(activeConfig){
	
	var cConfig = CONFIG[activeConfig];
	
	var app = express();
	
	//app.use(compress());  	
	
	//app.use(function(req, res, next) {
		//res.setHeader('Access-Control-Allow-Origin', '*');
		//next();
	//});
	
	
	
	
	console.log('Starting ' + cConfig.domain + ' Server on port ' + cConfig.port);
	
	var contentReplace = function(content) {
	    return content;

		return content.replace(
			new RegExp('\\<link href="(http://app.'+cConfig.domain+')?/css/\\d*/\\d*/styles.css"', 'g'),
			//  /\<link href="(http:\/\/app.handelsblatt.com)?\/css\/\d*\/\d*\/styles.css"/g,
			'<link href="/css/'+cConfig.css+'"'
		).replace(
			new RegExp('\\<script src="(http://app.'+cConfig.domain+')?/js/\\d*/\\d*/app.js"', 'g'),
			// /\<script type="text\/javascript" src="(http:\/\/app.handelsblatt.com)?\/js\/\d*\/\d*\/app.js"/g,
			'<script type="text/javascript" src="/js/app.js"'
		).replace(
			new RegExp('\\<script src="(http://app.'+cConfig.domain+')?/js/\\d*/\\d*/libs.(min.)?js"', 'g'),
			// /\<script type="text\/javascript" src="(http:\/\/app.handelsblatt.com)?\/js\/\d*\/\d*\/app.js"/g,
			'<script type="text/javascript" src="/js/libs.js"'		
		).replace(
			new RegExp('\\<link href="(http://app.'+cConfig.domain+')?/css/\\d*/\\d*/icons.css" rel="stylesheet"', 'g'),
			// /\<link href="(http:\/\/app.handelsblatt.com)?\/css\/\d*\/\d*\/icons.css" rel="stylesheet"/g,
			'<link href="/css/icons.css" rel="stylesheet"'
		).replace(
			new RegExp('http(s)?://finanzen.'+cConfig.domain+'/', 'g'),
			// /http(s)?:\/\/finanzen.handelsblatt.com\//g,
			'/vwd/'
		).replace(
			new RegExp('http://app.'+cConfig.domain+'/', 'g'),
			// /http:\/\/app.handelsblatt.com\//g,
			'/'
		);
	
	}
	
	app.use(function(req, res, next) {
	
		var map = [
			// { regex: /\/js\/app.js/g, file: './.tmp/app.js', type: 'text/javascript'},
			// { regex: /\/js\/iefix.js/g, file: './.tmp/iefix.js', type: 'text/javascript'},
			// { regex: /\/js\/libs.js/g, file: './.tmp/libs.js', type: 'text/javascript'},
			// { regex: /\/css\/habla-redesign.css/g, file: './.tmp/habla-new.css', type: 'text/css'},
			// { regex: /\/css\/wiwo.css/g, file: './.tmp/wiwo.css', type: 'text/css'},		
			// { regex: /\/css\/icons.css/g, file: './.tmp/icons.css', type: 'text/css'},
			// { regex: /\/images\/logo-header\/(.*)\/(.*)-formatOriginal.png/g, file: 'images/logo-habla.png', type: 'text/png'},
		];
	
		for(var i = 0; i < map.length; i++) {
	
			var regex = new RegExp(map[i].regex);
	
			if(regex.test(req.url) == true) {
	
				res.setHeader('Content-Type', map[i].type);
	
				fs.readFile(map[i].file, function(err, localFile) {
					
					res.send(localFile);
				});
	
				return;
	
			}
	
		}
	
		next();
	
	});
	

	
	app.all('/downloads/*', function(req, res) {
	
		request.get({url: 'http://www.' +cConfig.domain + req.url, proxy: PROXY}, function(err, response, body) {
	
			for(var prop in response.headers) {
				res.setHeader(prop, response.headers[prop]);
			}
	
			res.setHeader('Access-Control-Allow-Origin', '*');
	
			res.send(body);
	
		});
	
	});
	
	app.all('/proxy/*', function(req, res) {
	    console.log('Proxy: ', decodeURIComponent(req.url.split('/proxy/').pop()));
		request.get({url: decodeURIComponent(req.url.split('/proxy/').pop()) , proxy: PROXY}, function(err, response, body) {
	
			for(var prop in response.headers) {
				res.setHeader(prop, response.headers[prop]);
			}
	
			res.setHeader('Access-Control-Allow-Origin', '*');
	
			res.send(body);
	
		});
	
	});
		
	
	app.all('/vwd/*', function(req, res) {
	
		request.get({url: 'http://finanzen.' +cConfig.domain + req.url.replace(/^\/vwd\//,'/'), proxy: PROXY}, function(err, response, body) {
	
			for(var prop in response.headers) {
				res.setHeader(prop, response.headers[prop]);
			}
	
			res.setHeader('Access-Control-Allow-Origin', '*');
	
			var noAction = /(\.jpg|\.jpeg|\.gif|\.png|\.svg|\.js|\.css|\.woff|\.eot|\.ttf|chartNG\.gfn)/;
	
			if(!!req.url.match(noAction) === false) {
	
				body = contentReplace(body);
	
			} else {
				return res.redirect('http://finanzen.' +cConfig.domain + req.url);
	
			}
	
			res.send(body);
	
		});
	
	});
	
	app.all('/fonts/*', function(req, res) {
	
		fs.exists('.' + req.url, function(exists) {
	
			if(exists) {
	
				res.setHeader('Content-Type', 'fonts/x-font-' + req.url.split('.').splice(-1));
	
				res.end(
					fs.readFileSync('.' + req.url),
					'binary'
				);
	
			} else {
	
				res.redirect('http://app.' +cConfig.domain + req.url);
	
			}
	
		});
	
	});
	
	
	// app.all('/images/*', function(req, res) {
	
	// 	fs.exists('.' + req.url, function(exists) {
	
	// 		if(exists) {
	
	// 			res.setHeader('Content-Type', 'image/' + req.url.split('.').splice(-1));
	
	// 			res.end(
	// 				fs.readFileSync('.' + req.url),
	// 				'binary'
	// 			);
	
	// 			//fs.readFile('.' + req.url, {encoding: 'utf-8'}, function(err, file) {
	// 			//	res.send(err || file);
	// 			//});
	
	// 		} else {
	
	// 			res.redirect('http://app.' +cConfig.domain + req.url);
	
	// 		}
	
	// 	});
	
	// });


    //Proxy for Webtrekk
    app.get('/357500119523122/wt', function(req, res){
        var  newUrl = req.url.split('/');
        newUrl.shift();
        newUrl = 'http://handelsblatt01.webtrekk.net/' + newUrl.join('/');
        newUrl = newUrl.replace('vhb-hb-test.herokuapp.com', 'www.handelsblatt.com');

        request.get({url: newUrl, proxy: PROXY}, function(err, response, body) {
            for(var prop in response.headers) {
                res.setHeader(prop, response.headers[prop]);
            }
            res.send(body);
        });
        
    });

	
	app.all('/*', function(req, res) {
	
		if(req.url.indexOf('/') === 0) {
			var url = 'http://www.' +cConfig.domain + req.url;
		} else {
			var url = req.url;
		}
	
		try {
	
			request.get({url: url, proxy: PROXY}, function(err, response, body) {
	
				for(var prop in response.headers) {
					res.setHeader(prop, response.headers[prop]);
				}
	
				var noAction = /(\.jpg|\.jpeg|\.gif|\.png|\.svg|\.js|\.css|\.woff|\.eot|\.ttf)$/;
	
				if(!!url.match(noAction) === false) {
	
					body = contentReplace(body);
	
				} else {

				    return res.redirect(url);

				}
				
				//patch body if html
				if ((url.indexOf('.html') > -1 || url.split('/').pop() === '') && url.indexOf('empty.js') === -1){
					//console.log('Patching ' + url, response.headers['content-type']);
					body = helper.patchHTML(body);
                    //fix tracking
                    body = body.replace('handelsblatt01.webtrekk.net', 
                        process.env.proxystr ? 'localhost:38110' : 'vhb-hb-test.herokuapp.com');
				}
	
				return res.send(body);
	
			});
	
		} catch(e) {
	
			console.log(e);
	
		}
	
	});
	
	app.set('port', process.env.PORT || cConfig.port);
	
	var server = app.listen(app.get('port'), function() {
	});
}

if (!module.parent) {
	startServer(activeConfig);
}

module.exports = {
	startServer: startServer,
	reloadHelper: helper.reload
};	 

/**
 * SubdomainHandler
 *
 * This runs on all routes and manipulates the req.url to include the tag
 * as the first parameter (/:tag/foo/bar). This then triggers different route listeners.
 * It is important because it transforms the fragile subdomain mesh tag into a more
 * tageable route parameter that is easily retrievable in later route middleware.
 *
 * USAGE:
 *
 *		// add express-subdomain-handler to your express middleware stack
 *		app.use( require('express-subdomain-handler')({ baseUrl: 'example.com', prefix: 'myprefix', logger: true, ignoreExtensions:[".css", ".js", ".html", ".jpg", ".png", ".svg", ".gif",".woff", ".ttf"]}) );
 *
 *		// setup routes to catch subdomain urls
 *		// eg. 'http://mysubdomain.example.com/homepage'
 *		app.get('/myprefix/:thesubdomain/thepage', function(req, res, next){
 *
 *			// for the example url this will print 'mysubdomain'
 *			res.send(req.params.thesubdomain);
 *
 *		});
 */

var log = require('../../../config/log-config');

log.log( 'info', 'ESH --'+ ' module loaded');
function _escapeRegExp(str) {
	return str.replace(/[-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
}


/**
 * Creates the custom regex object from the specified baseUrl
 *
 * @param  {string} baseUrl [description]
 * @return {Object} the regex object
 */
function subdomainRegex(baseUrl){
  log.log( 'info', 'ESH --'+ 'subdomainRegex baseUrl' + baseUrl);
	var regex;

	baseUrl = _escapeRegExp(baseUrl);

	regex = new RegExp('((?!www)\\b[-\\w\\.]+)\\.' + baseUrl + '(?::)?(?:\d+)?');

	return regex;
}



module.exports = function(options){

	// prefix default
	options.prefix = options.prefix || 'subdomain';

	// logger default
	options.logger = (options.logger === true) ? true : false;

	// allow 'base' or 'baseUrl'
	options.baseUrl = options.baseUrl || options.base;

  log.log( 'info', 'ESH --'+ 'opt.baseUrl ' + options.baseUrl);
  log.log( 'info', 'ESH --'+ 'opt.base ' + options.base);
	// ignore extensions
	options.ignoreExtensions = options.ignoreExtensions || [];

	// return error if no baseUrl was specified
	if(!options.baseUrl) return next("express-subdomain-handler: You haven't specified a baseUrl, this is required!");

	if(options.logger) console.log("\nESH: Rewriting all subdomain routes to /%s/[subdomain1]/[subdomain2]/path/after/baseurl for baseUrl %s \n", options.prefix, options.baseUrl);

	// the returned function
	return function(req, res, next){
		var i,

		// original req.url
		originalUrl = req.headers.host + req.url,

		// create our subdomain regex
		regex = subdomainRegex(options.baseUrl),

		// extract the subdomain string from the req.url
		subdomainString = regex.exec(req.headers.host);

    log.log( 'info', 'ESH --'+ 'originalUrl ' + originalUrl);
    //log.log( 'info', 'ESH --'+ 'regex ' + regex);
    log.log( 'info', 'ESH --'+ 'subdomainString ' + subdomainString);
		// if there is no subdomain, return
		if(!subdomainString) return next();

		// if there files with below extentions so don't apply subdomain logic
		for(var i=0;i<options.ignoreExtensions.length;i++){
			if(req.url.indexOf(options.ignoreExtensions[i])>0){
				return next();
			}
		}

		// create an array of subdomains
		subdomainArray = subdomainString[1].split('.');

		// cache number of subdomains
		i = subdomainArray.length;

		// prepend each subdomain in reverse order
		while(i--){ req.url = '/' + subdomainArray[i] + req.url; }

		// finally prepend the suffix so we end up with
		// something like: "/subdomain/[first]/[second]/page"
		req.url = '/' + options.prefix + req.url;

    log.log( 'info', 'ESH --'+ 'generated req.url ' + req.url);
		// if logging is turned on
		if(options.logger) console.log('ESH: %s => %s', originalUrl, req.url);

		// jump to next middleware in stack
		next();
	};
};

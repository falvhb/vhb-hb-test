var cheerio = require('cheerio');
var fs = require('fs');

function l(txt){
	console.log('HELP> '+txt);
}

var CONFIG = {
	dirTickets: './vhb-proxy-helper/tickets/'
};


//via http://stackoverflow.com/questions/9210542/node-js-require-cache-possible-to-invalidate
/**
 * Removes a module from the cache
 */
require.uncache = function (moduleName) {
    // Run over the cache looking for the files
    // loaded by the specified module name
    require.searchCache(moduleName, function (mod) {
        delete require.cache[mod.id];
    });

    // Remove cached paths to the module.
    // Thanks to @bentael for pointing this out.
    Object.keys(module.constructor._pathCache).forEach(function(cacheKey) {
        if (cacheKey.indexOf(moduleName)>0) {
            delete module.constructor._pathCache[cacheKey];
        }
    });
};

/**
 * Runs over the cache to search for all the cached
 * files
 */
require.searchCache = function (moduleName, callback) {
    // Resolve the module identified by the specified name
    var mod = require.resolve(moduleName);

    // Check if the module has been resolved and found within
    // the cache
    if (mod && ((mod = require.cache[mod]) !== undefined)) {
        // Recursively go over the results
        (function run(mod) {
            // Go over each of the module's children and
            // run over it
            mod.children.forEach(function (child) {
                run(child);
            });

            // Call the specified callback providing the
            // found module
            callback(mod);
        })(mod);
    }
};


var helper = {};
var tickets = [];
	
function init(){
	l('Init...');
	tickets.splice(0,tickets.length)

	
	//read vhb-proxy-helper/tickets folder
	var folders = fs.readdirSync(CONFIG.dirTickets)
		
	folders.forEach(function(folder){
		
		var ticket = {
			id: folder
		};
		
		//load patch.js
		try {
			//l(CONFIG.dirTickets + folder + '/patch.js');
			var pathPatchJS = './tickets/' + folder + '/patch.js';
			require.uncache(pathPatchJS);
			ticket.module = require(pathPatchJS);
		} catch(e){
			l('ERROR: Folder ' + folder + ' must contain patch.js module.');	
		}
		
		//load html in case
		if (ticket.module.config.hasHtml){
			try {
				ticket.html =fs.readFileSync(CONFIG.dirTickets + folder + '/patch.html').toString();
			} catch(e){
				l('ERROR: Folder ' + folder + ' must contain patch.html file.');	
			}	
		} 
		
		if (typeof ticket.module.config.disabled === 'undefined'){
			tickets.push(ticket);
			l(' Patch: ' + folder + ' loaded.');	
		} else {
			l(' Patch: ' + folder + ' available but disabled');
		}
	});
}
  






init();

/**
 * Uses all available tickets to patch HTML on the flight
 */
helper.patchHTML = function(html){
	var $ = cheerio.load(html);
	tickets.forEach(function(ticket){
		if (ticket.module.config.hasPatch){
			ticket.module.patch($, ticket.html);
		}
	});
	return $.html();
}


helper.reload = function(){
	console.log('Reloading patches');
	init();
}

l('Ready.');
module.exports = helper;
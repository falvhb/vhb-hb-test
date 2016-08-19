//EXAMPLE

function patch($, html){
	//modify dom
	$('a').addClass('link');
	//$(html).prependTo('.hb-article');
	
	$('.hb-article').first().prepend(html);
}


module.exports = {
	config: {
		disabled: true,		
		hasPatch: true,
		hasHtml: true
	},
	patch: patch	
};
//EXAMPLE

function patch($, html){

    var map = {
        '2001': {width: 140, new: ''},
        '2008': {width: 112, new: '2001'},
        '2009': {width: 100, new: '2001'},
        '2121': {width: 133, new: '2001'},

        '2012': {width: 280, new: ''},
        '2006': {width: 260, new: '2012'},
        '2011': {width: 258, new: '2012'},

        '2010': {width: 550, new: ''},
        '2013': {width: 500, new: '2010'},

        '2003': {width: 620, new: ''},
        '2005': {width: 590, new: '2003'}
    };


    $('img').each(function(i, elem) {   
	 	 var src = $(this).attr('src').split('/').pop();
		 src = src.split('.')[0].split('-').pop().substr(6);
		 if (map[src] && map[src].new){
            console.log('IMG>' + src);
            $(this).attr('src', $(this).attr('src').replace('format'+src, 'format'+map[src].new));
            //Fix size via native element width and height
            $(this).attr('width', map[src].width);
            $(this).parent().attr('style', 'box-shadow: 0px 0px 0px 2px rgba(255,20,147,1);');
         }

	 });
	

}


module.exports = {
	config: {
		//disabled: true,		
		hasPatch: true,
		//hasHtml: true
	},
	patch: patch	
};




	var Class 				= iridium( "class" )
		, log 				= iridium( "log" );

	module.exports = new Class( {



		  getHeaders: function(){
			return { "Content-Type": "Text/HTML" };
		}



		, render: function( request, response, status, data ){
			return '<html><head><script src="https://google-code-prettify.googlecode.com/svn/loader/run_prettify.js"></script></head><body><pre class="prettyprint">' + JSON.stringify( data ) + '</pre></body></html>';
		}


	} );
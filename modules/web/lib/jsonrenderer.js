



	var Class 				= iridium( "class" )
		, log 				= iridium( "log" );

	module.exports = new Class( {


		getHeaders: function(){
			return { "Content-Type": "Application/JSON" };
		}



		, render: function( request, response, status, data ){
			return JSON.stringify( data || {} );
		}
	} );
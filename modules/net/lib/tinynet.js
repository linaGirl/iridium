



	var Class = iridium( "class" )
		, Events = iridium( "events" )
		, log = iridium( "log" );





	var TinyNet = new Class( {
		$id: "net.TinyNet"
		, inherits: Events


		, init: function(){

		}



		, getConnection: function(){

		}
	} );






	module.exports = new Class( {
		$id: "net.tinyNet"


		, init: function( options ) {
			return global.tinyNet || ( global.tinyNet = new TinyNet() );
		}
	} );
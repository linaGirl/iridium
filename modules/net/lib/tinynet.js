



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
			// tinynet works on a per process base, one connection per target host, multiple virtual connections on top of it
			return global.tinyNet || ( global.tinyNet = new TinyNet() );
		}
	} );
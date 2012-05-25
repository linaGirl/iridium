



	var Class = iridium( "class" )
		, Events = iridium( "events" )
		, log = iridium( "log" )
		, TinyVirtualConnection = require( "./tinyvirtualconnection" )
		, TinyConnection = require( "./tinyconnection" )
		, crypto = require( "crypto" );





	var TinyNet = new Class( {
		$id: "net.TinyNet"
		, inherits: Events


		, __connections: {}



		, init: function(){
			this.__listen();
		}



		, listen: function(){
			
		}
	} );



	




	module.exports = new Class( {
		$id: "net.tinyNet"


		, init: function( options ) {
			// tinynet works on a per process base, one connection per target host, multiple virtual connections on top of it
			return global.tinyNet || ( global.tinyNet = new TinyNet() );
		}
	} );
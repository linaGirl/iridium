


	var Class = iridium( "class" )
		, Events = iridium( "events" )
		, log = iridium( "log" )
		, os = require( "os" );




	module.exports = new Class( {
		$id: "net.tinyBuffer"
		, inherits: Events


		, __minFreeMemory: 0x1FFFFFF // ~ 33 MB
		, __buffer: []
		, __currentSize: 0



		, init: function( options ){

		}



		, get: function(){
			var item = this.__buffer.shift();
			this.__currentSize -= item.length;
			return item;
		}



		, push: function( data ){
			this.__buffer.push( data );
			this.__currentSize += data.length;

			// return false if there is not enough space left ...
			return ( ( os.freemem() - this.__minFreeMemory - this.__currentSize ) > 0 );
		}
	} );
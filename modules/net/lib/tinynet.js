



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
		, __processId: ""
		, __uidCounter: Math.round( Math.random() * 0xFFFF ) // init vector for process id



		, init: function(){
			this.__processId = process.pid + "" + Date.now();
		}


		, __prepareConnection: function( host, port, id ){
			if ( ! this.__connections[ id ] ){
				this.__connections[ id ] = new TinyConnection( {
					id: id
					, host: host
					, port: port
				} );
			}

			return this.__connections[ id ];
		}



		, getConnection: function( host, port ){
			var id = host + ":" + port;

			// request the connection @ the pool
			var connection = ;

			// return virtual connection
			return new TinyVirtualConnection( {
				host: host
				, port: port
				, connectionId: id
				, id: this.__uid()
				, connection: this.__prepareConnection( host, port, id )
			} );
		}




		, __uid: function(  ){
			return crypto.createHash( "sha512" ).update( this.__processId + "" + ( this.__uidCounter++ ) + "" + Math.random() ).digest( "binary" );
		}
	} );






	module.exports = new Class( {
		$id: "net.tinyNet"


		, init: function( options ) {
			// tinynet works on a per process base, one connection per target host, multiple virtual connections on top of it
			return global.tinyNet || ( global.tinyNet = new TinyNet() );
		}
	} );



	var Class 		= iridium( "class" )
		, Events 	= iridium( "events" )
		, log 		= iridium( "log" );


	var net 		= require( "net" )
		, os 		= require( "os" );


	var Connection 	= require( "./connection" );





	module.exports = new Class( {
		$id: "net.tiny.server"
		, inherits: Events



		, __port: null
		, __address: null



		, init: function(){
			this.__listen();
		}



		, __handleError: function( err ){
			log.info( "Server error: " + err );
			this.emit( "error", err );
		}


		, __handleClose: function(){
			this.emit( "close" );
		}


		, __handleConnection: function( connection ){
			this.emit( "connection", new Connection( { connection: connection } );
		}




		, __handleListening: function(){
			var addrInfo = this.__server.address();
			this.__port = addrInfo.port;

			var interfaces = os.networkInterfaces(), keys = Object.keys( interfaces ), i = keys.length, k;
			while( i-- ){
				k = interfaces[ keys[ i ] ].length;
				while( k-- ){
					if ( ! interfaces[ keys[ i ] ][ k ].internal && interfaces[ keys[ i ] ][ k ].family === addrInfo.family ){
						this.__address = interfaces[ keys[ i ] ][ k ].address;
						break;
					}
				}
			}

			log.debug( "server is listening on [" + this.__address + ":" + this.__port + "] ...", this );
			this.emit( "listening", { port: this.__port, address: this.__address } );
		}





		, close: function(){
			if ( this.__server ){
				this.__server.close();
			}

			// destroy this class
			this.__destroy();
		}




		, __destroy: function(){

			// emit the destory event
			this.emitNow( "destroy" );

			// remove all eventlisteners
			this.off();
		}




		, __listen: function(){
			this.__server = net.createServer();

			// add events
			this.__server.on( "listening", this.__handleListening.bind( this ) );
			this.__server.on( "close", this.__handleClose.bind( this ) );
			this.__server.on( "connection", this.__handleConnection.bind( this ) );
			this.__server.on( "error", this.__handleError.bind( this ) );

			// start listening on a random port
			this.__server.listen( 0 );

			this.__port = this.__server.address();
		}
	} );
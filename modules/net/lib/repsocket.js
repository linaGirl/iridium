



	var Class = iridium( "class" )
		, Events = iridium( "events" )
		, log = iridium( "log" )
		, net = require( "net" )
		, os = require( "os" );




	module.exports = new Class( {
		$id: "net.RepSocket"
		, inherits: Events

		, __port: 0
		, __address: ""


		, init: function( options ){

			// start the server
			this.__bind();
		}



		, _handleListening: function(){
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

			this.emit( "listening", { port: this.__port, address: this.__address } );
		}




		, __handleError: function( err ){
			log.info( "Server error: " + err );
			this.emit( "error", err );
		}




		, __handleClose: function(){
			this.emit( "close" );
		}



		, __handleConnection: function( connection ){
			connection.on( "data" )
		}



		// bind ths socket, start accepting data
		, __bind: function( config ){
			this.__server = net.createServer();

			// add events
			this.__server.on( "listening", this._handleListening.bind( this ) );
			this.__server.on( "close", this.__handleClose.bind( this ) );
			this.__server.on( "connection", this.__handleConnection.bind( this ) );
			this.__server.on( "error", this.__handleError.bind( this ) );

			// start listening on a random port
			this.__server.listen( 0 );

			this.__port = this.__server.address();
		}
	} );


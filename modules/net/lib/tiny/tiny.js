

	var Class 				= iridium( "class" )
		, Events 			= iridium( "events" )
		, log 				= iridium( "log" );

	
	var Server 				= require( "./server" )
		, DirectoryClient 	= require( "./directoryclient" )
		, Connection 		= require( "./connection" );





	var Net = new Class( {
		$id: "net.tiny.net"
		, inherits: Events


		, __connections: {}
		, __uuidmap: {}



		, init: function(){
			this.__listen();
			this.__tinyDirectory = new DirectoryClient();
		}




		// returns true if the data was buffered, false if the data was sent ...
		, send: function( uuid, data ){
			return this.__getConnection( uuid ).send( data );
		}



		, __getConnection: function( uuid ){
			var connection;

			// yeah, there is a connection
			if ( this.__uuidmap[ uuid ] && this.__connections[ this.__uuidmap[ uuid ] ] ){
				return this.__connections[ this.__uuidmap[ uuid ] ];
			}

			// the conenction is initializing ...
			else if ( typeof this.__uuidmap[ uuid ] === "object" ){				
				return this.__uuidmap[ uuid ];
			}

			// connection is not loading, create a new one
			else {				
				connection = this.__uuidmap[ uuid ] = new Connection( { uuid: uuid } );


				// handle conenct
				connection.on( "connect", function( connectionId ){

					// conenctions exists already
					if ( this.__connections[ connectionId ] ){
						// close the duplicate
						connection.close();
					}
					else {
						// store
						this.__connections[ connectionId ] = connection;
					}

					// remap 
					this.__uuidmap[ uuid ] = connectionId;
				}.bind( this ) );



				// handle connection close
				connection.on( "close", function( connectionId ){

					// remove from index
					if ( this.__connections[ connectionId ] ){
						delete this.__connections[ connectionId ];
					}
				}.bind( this ) );

				return connection;
			}
		}




		, __handleConnection: function( connection ){
			connection.on( "message", function( message ){
				if ( message.uuid ){
					this.emit( message.uuid, message.data );
				}
				else {
					log.dir( message ;
					throw new Error( "unrecognized message received!" );
				}
			}.bind( this ) )
		}




		, __listen: function(){
			this.__server = new Server( {
				on: {
					listening: function( adrInfo ){
						this.__ready = true;
						this.__port = adrInfo.port;
						this.__address = adrInfo.address;
					}.bind( this )
					, close: this.__listen.bind( this )
					, connection: this.__handleConnection.bind( this ) 
				}
			} );
		}
	} );



	




	module.exports = new Class( {
		$id: "net.tinyNet"


		, init: function( options ) {
			// tinynet works on a per process base, one connection per target host, multiple virtual connections on top of it
			return global.tinyNet || ( global.tinyNet = new TinyNet() );
		}
	} );
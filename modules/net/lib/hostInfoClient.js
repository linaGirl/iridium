	"use strict"


	var Class = iridium( "class" )
		, Events = iridium( "events" )
		, log = iridium( "log" )
		, Socket = require( "./socket" );



	var HostInfoClient = module.exports = new Class( {
		$id: "net.hostInfoClient"
		, Extends: Events


		// waiting callbacks
		, __queue: []


		, constructor: function(){
			this.__socket = new Socket( { 
				type: "req"
				, uri: "tcp://127.0.0.1:6842"
				, on: {
					message: this.__handleMessage.bind( this ) 
				}
			} ).send( {
				action: "getHostConfig"
			} ) ;

			// do some cleanup
			process.on( "exit", this.__destroy.bind ( this ) );
		}



		// hndle message
		, __handleMessage: function( message ){
			var i;

			if ( message.info ){
				log.info( "got hostinfo ....", this );
				this.__hostInfo = message.info;

				// report to waiting requests
				i = this.__queue.length;
				while( i-- ) { this.__queue[ i ]( message.info ); }
				this.__queue = [];
			}
			else {
				log.error( "failed to get hostinfo!", this );
			}
		}



		// get hostinfo
		, getInfo: function( callback ){
			return ( this.__hostInfo ? callback( this.__hostInfo ) : this.__queue.push( callback || function(){} ) ), this;
		}



		// end the client
		, end: function(){
			this.__destroy();
		}



		// when its time to free memory
		, __destroy: function(){
			this.__socket.end();
			this.emitNow( "detroy" );
			this.off();
		}
	} );
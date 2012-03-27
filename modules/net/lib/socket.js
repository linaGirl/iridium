	
	


	var dep = require( "../dep" )
		, Class = iridium( "class" )
		, Events = iridium( "events" )
		, log = iridium( "log" );





	var Socket = module.exports = new Class( {
		$id: "net.Socket"
		, Extends: Events


		// the default protocol to use
		, __protocolType: "msgpack"

		// socket type
		, __socketType: null

		// the sockets identity, dont set if not explicit used!
		, __identity: null

		// uri to listen / connect to may be passed, else autocreated or requested @ the directoy
		, __uri: null



		// go
		, constructor: function( options ){
			var keys, i;

			// socket type
			this.__socketType = options.type;

			// set socket identity
			if ( options && options.identity ) this.__identity = options.identity;

			// the usri to listen on / subscribe to
			this.__uri = options.uri || null;
			this.__ip = options.ip || null;


			// protocol handler
			this.__protocol = dep.msgpack;


			// create the socket
			this.__listen();
		}



		// send
		, send: function( message ){
			return this.__socket.send( this.__protocol.pack( message ) ), this;
		}


		// clsoe
		, close: function(){
			return this.__socket.close(), this;
		}



		// message from socket
		, __handleMessage: function( data ){
			this.emit( "message", this.__protocol.unpack( data ) );
		}


		
		// socket close
		, __handleClose: function(){
			log.debug( "socket was cloed ...", this );
			this.emit( "close" );
		}

		// socket error
		, __handleError: function( err ){
			log.warn( "socket error!", this );
			log.trace( err );
			this.emit( "error", err );
		}


		// socket is now listening
		, __handleListening: function(){
			log.debug( "socket [" + this.__uri + "] is now listening ...", this );
			this.emit( "listening" );
		}




		// getUri
		, getUri: function(){
			return this.__uri;
		}



		// listen
		, __listen: function(){

			// create the socket
			this.__socket = dep.zeromq.socket( this.__socketType );

			// listen for events
			this.__socket.on( "close", this.__handleClose.bind( this ) );
			this.__socket.on( "message", this.__handleMessage.bind( this ) );
			this.__socket.on( "error", this.__handleError.bind( this ) );

			// set the sockets identity
			if ( this.__identity ) this.__socket.identity = this.__identity;

			// set socket specific options
			switch ( this.__socketType ){
				case "rep":
				case "pub":
					if ( this.__ip || this.__uri ) this.__bind( this.__uri );
					break;

				case "req":
				case "sub":
					this.__socket.connect( this.__uri );
					break;
			}
		}




		// bind
		, bind: function( uri, ip ){
			this.__bind( uri, ip );
		}



		// bind
		, __bind: function( uri, ip ){
			this.__uri = uri || "tcp://" + ( ip || this.__ip ) + ":" + Math.round( Math.random() * 55535 + 10000 );
			
		 	this.__socket.bind( this.__uri, function( err ){
				if ( err ){
					if ( err.message.indexOf( "Address already in use" ) === 0 && ! uri ){
						this.__bind( null, ip );
					}
					else {
						this.__handleError( err );
					}
				}
				else {
					this.__handleListening();
				}
			}.bind( this )  );
		}
	} );
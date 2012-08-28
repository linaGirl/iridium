	


	var Class 			= iridium( "class" )
		, Events 		= iridium( "events" )
		, log 			= iridium( "log" );


	var crypto 			= require( "crypto" )
		, net 			= require( "net" );


	var JSONProtocol 	= require( "./jsonprotocol" );




	module.exports = new Class( {
		$id: "net.directoryclient"
		, inherits: Events

		, __retries: 0
		, __connected: false
		, __buffer: []
		, __idCounter: 0
		, __callbacks: {}

		, __port: 0
		, __address: null




		, init: function( options ){
			// the directory maintains different collections
			$if ( typeof options.collection !== "string" ) throw new Error( "please specifiy the collection this directory client is used for" );
			this.__collection = options.collection;

			this.__port = options.port;
			this.__address = options.address;

			// decode incoming data
			this.__protocol = new JSONProtocol( { on: { data: this.__handleData.bind( this ) } } );

			// connect to directory services
			this.__connect();
		}






		// id > sting
		// timeout ( optional ) > defaults to 60'000 ms
		, lookup: function( id, timeout, callback ){
			if ( typeof timeout === "function" ) callback = timeout, timeout = 60000;
			if ( typeof timeout !== "number" ) timeout = 60000;

			this.__send( {
				collection: 	this.__collection
				, action: 		"lookup"
				, id: 			id
				, timeout: 		timeout
			}, timeout, callback ? function( err, data ){
				this.__handleResponse( err, data, callback );
			}.bind( this ) : null );
		}


		// register a new item @ the directory
		, store: function( id, data, ttl, callback ){
			if ( typeof ttl === "function" ) callback = ttl, ttl = 3600000;
			if ( typeof ttl !== "number" ) ttl = 3600000;

			this.__send( {
				collection: 	this.__collection
				, action: 		"store"
				, id: 			id
				, data: 		data
				, ttl: 			ttl
				, timeout: 		60000
			}, 60000, callback ? function( err, data ){
				this.__handleResponse( err, data, callback );
			}.bind( this ) : null );
		}

		, remove: function( id, callback ){
			this.__send( {
				collection: 	this.__collection
				, action: 		"remove"
				, id: 			id
				, timeout: 		60000
			}, 60000, callback ? function( err, data ){
				this.__handleResponse( err, data, callback );
			}.bind( this ) : null );
		}


		, __handleResponse: function( err, data, callback ){
			if ( err ){
				callback( err );
			}
			else if ( data && typeof data === "object" ){
				if ( data.status === "ok" ){
					callback( null, data.data );
				}
				else if ( data.err ) {
					callback( new Error( data.err ) );
				}
				else {
					callback( new Error( "unknown_remote_error" ) );
				}
			}
			else {
				callback( new Error( "no_data" ) );
			}
		}


		, __handleData: function( data ){
			if ( data.s && data.p ){
				if ( this.__callbacks[ data.s ] ) {
					this.__callbacks[ data.s ]( data.p );
					delete this.__callbacks[ data.s ];
				}
				else {
					//log.warn( "discarding packet due to missing callback ( could be timeout )", this );
				}
			}
			else {
				log.debug( "received invalid packet!", this );
				log.dir( data );
			}
		}


		 // packet == __i__XXpayload where XX = unsigned 16 bit integer lower endian
		, __send: function( payload, timeout, callback ){
			var sid = this.__id()
				, packet = JSONProtocol.encode( { s: sid, p: payload } )
				, timeout, idx;

			if ( callback && typeof callback === "function" ){

				this.__callbacks[ sid ] = function( payload ){
					clearTimeout( timeout );
					callback ( null, payload );
				};

				timeout = setTimeout( function(){
					this.__callbacks[ sid ]( new Error( "timeout" ) );
					idx = this.__buffer.indexOf( packet );
					if ( idx < -1 ) this.__buffer.splice( idx, 1 );
					delete this.__callbacks[ sid ];
				}.bind( this ) , timeout );
			}

			if ( this.__connected ){
				this.__connection.write( packet );
			}
			else {
				if ( this.__buffer.length > this.__maxBuffered ){
					if ( callback && typeof callback === "function" ) callback( new Error( "buffer_overflow" ) );
				} else {
					this.__buffer.push( packet );
				}
			}
		}

		, __id: function(){
			if ( this.__idCounter > 0xFFFFFFFFFFFFF ) this.__idCounter = 0;
			return ++this.__idCounter + "" + Date.now();
		}

		, __handleRawData: function( chunk ){
			this.__protocol.decode( chunk );
		}

		, __handleConnect: function(){
			this.__retries = 0;
			this.__connected = true;

			while( this.__connected && this.__buffer.length > 0 ){
				this.__connection.write( this.__buffer.shift() );
			}
		}

		, __handleClose: function( err ){
			this.__connected = false;
			if ( err ){
				if ( this.__retries === 0 ) {
					this.__connect();
				}
				else {
					setTimeout( this.__connect.bind( this ), 1000 );
				}
				this.__retries++;
			}
		}

		, __handleError: function( err ){
			log.error( err, this );
		}

		, __handleEnd: function(){
			this.__connected = false;
		}

		, __connect: function(){
			this.__connection = net.createConnection( { address: this.__address, port: this.__port } );
			this.__connection.on( "close", 	this.__handleClose.bind( this ) );
			this.__connection.on( "connect", this.__handleConnect.bind( this ) );
			this.__connection.on( "error", 	this.__handleError.bind( this ) );
			this.__connection.on( "data", 	this.__handleRawData.bind( this ) );
			this.__connection.on( "end", 	this.__handleEnd.bind( this ) );
		}
	} );
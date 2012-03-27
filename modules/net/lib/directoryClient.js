

	var Class = iridium( "class" )
		, Events = iridium( "events" )
		, log = iridium( "log" )
		, Socket = require( "./socket" );





	var DirectoryClient = module.exports = new Class( {
		$id: "net.DirectoryClient"
		, Extends: Events


		// is the client ready?
		, __ready: false

		// queued requests
		, __queue: []

		// callbacks
		, __callbacks: {}

		// registered items ( used to shutdown properly )
		, __items: {}




		, constructor: function( options ){

			// locate the directory service
			global.hostInfoClient.getInfo( function( info ){
				var i = this.__queue.length;;

				this.__hostInfo = info;
				this.__createSocket();
				this.__ready = true;

				// empty the queue
				while( i-- ){
					this.__socket.send( this.__queue[ i ] );
				}
			}.bind( this ) );


			// clean up on exit
			process.on( "exit", this.__destroy.bind( this ) );
		}






		// de register notification
		, deregisterNotification: function( notificationId, serviceName, callback ){
			this.__send( {
				context: "notification"
				, action: "remove"
				, serviceName: serviceName
				, notificationId: notificationId
			}, callback );
		}


		// register notification
		, registerNotification: function( serviceName, callback ){
			this.__send( {
				context: "notification"
				, action: "register"
				, serviceName: serviceName
			}, callback );
		}




		// un register
		, deregisterService: function( serviceId, serviceName, callback ){
			this.__send( {
				context: "service"
				, action: "remove"
				, serviceName: serviceName
				, serviceId: serviceId
			}, callback );
		}


		// register
		, registerService: function( serviceName, uri, callback ){
			this.__send( {
				context: "service"
				, action: "register"
				, serviceName: serviceName
				, uri: uri
			}, callback );
		}






		// message from rep
		, __handleMessage: function( message ){
			if ( message && message.requestId && this.__callbacks[ message.requestId ] ){

				// maintain registration status
				if ( message && message.message && message.message.success && message.message.context && message.message.action ){
					id = message.message.context === "service" ? message.message.serviceId : message.message.notificationId;

					if ( message.message.action === "register" ){
						this.__items[ id ] = {
							type: message.message.context
							, serviceName: message.message.serviceName
						};

						this.__callbacks[ message.requestId ]( message.message.serviceId || message.message.notificationId );
					}
					else {
						if ( this.__items[ id ] ) delete this.__items[ id ];
						this.__callbacks[ message.requestId ]();
					}
				}

				this.__callbacks[ message.requestId ]();
				delete this.__callbacks[ message.requestId ];
			}
			else {
				log.warn( "discarding message due to insufficient data!", this );
				og.dir( message );
			}
		}





		// send
		, __send: function( message, callback ){

			// timeout / callback handling
			if ( callback ){
				message = {
					message: message
					, requestId: this.__getRequestId()
				};

				// store the callback
				this.__callbacks[ message.requestId ] = callback;
			}

			if ( this.__ready ){
				this.__socket.send( message );
			}
			else {
				this.__queue.push( message );
			}
		}





		// create the socket
		, __createSocket: function(){

			this.__socket = new Socket( {
				type: "req"
				, uri: "tcp://" + this.__hostInfo.directoryService + ":6843"
				, on: {
					message: this.__handleMessage.bind( this )
					, error: function( err ){
						throw err;
					}.bind( this ) 
				}
			} );
		}



		// create e requestID
		, __getRequestId: function(){
			return Math.random() + "_" + Date.now();
		}




		// end
		, end: function( deregisterAllServices ){
			this.__destroy( ! deregisterAllServices );
		}


		// destroyx
		, __destroy: function( dontDeregister ){
			var keys = Object.keys( this.__items ), i = keys.length;

			if ( this.__socket ){
				while( i-- ){
					if ( ! dontDeregister || this.__items[ keys[ i ] ].type === "notification" ) {

						// send without request iud, will trigger that no response is ent
						this.__socket.send( {
							message: {
								context: this.__items[ keys[ i ] ].type
								, serviceName: this.__items[ keys[ i ] ].serviceName
								, serviceId: keys[ i ]
								, notificationId: keys[ i ]
							}
						} );
					}
				}

				this.__socket.close();
				delete this.__socket;
			}
		}



		// apply a scope
		, scope: function( scope ){
			this.__scope = scope;
		}
	} );
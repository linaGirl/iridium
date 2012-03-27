
	
	var Class = iridium( "class" )
		, Events = iridium( "events" )
		, log = iridium( "log" )
		, net = iridium.module( "net" );




	var Directory = module.exports = new Class( {
		$id: "service.Directory"
		, Extends: Events


		// the port this service listens on
		, __port: 33987

		// a serial number which ius assigned to services
		, __serial: 0


		// ths service registry storage, only inmemory
		, __services: {}



		// class contructor
		, constructor: function( options ){
			log.info( "directory service is initializing ....", this );

			// you may define a special port where the service is available
			if ( options && typeof options.port === "number" ) this.__port = options.port;

			// start the server
			this.__server = net.createServer( {
				port: this.__port
				, protocol: net.protocol.f2
				, on: {
					listen: this.__handleListen.bind( this )
					, error: this.__handleError.bind( this )
					, connection: this.__handleConnection.bind( this )
					, close: this.__handleClose.bind( this ) 
				}
			} );
		}







		// service actions
		, __handleServiceMessage: function( message, connection ){
			var keys, i, currentRequest, uid;

			switch( message.action ){



				// a new service registers itself
				case "register":
					if ( ! this.__services[ message.serviceId ] ) this.__services[ message.serviceId ] = { instances: {}, notificationRequests: [] };
					
					// create a unique service id
					uid = this.__createId();

					// add to directory
					this.__services[ message.serviceId ].instances[ connection.getId() ] = {
						host: connection.getHost()
						, port: connection.getPort()
						, uid: uid 
					};

					// check for notifaction listeners
					if ( this.__services[ message.serviceId ].notificationRequests.length > 0 ){
						i = this.__services[ message.serviceId ].notificationRequests.length;

						while( i-- ){
							currentRequest = this.__services[ message.serviceId ].notificationRequests[ i ];
							if ( currentRequest && currentRequest.connection.isConnected() ){
								currentRequest.connection.send( {
									context: "notification"
									, action: "notify"
									, transactionId: currentRequest.transactionId
									, services: this.__services[ message.serviceId ].instances
								} );
							}
						}

						// reset
						this.__services[ message.serviceId ].notificationRequests = [];
					}

					// remove service on connection close
					connection.on( "close", function(){
						if ( this.__services[ message.serviceId ].instances[ connection.getId() ] ){
							delete this.__services[ message.serviceId ].instances[ connection.getId() ];
						}
					}.bind( this ) );

					// answer the registration request
					connection.send( {
						context: "service"
						, action: "register"
						, transactionId: message.transactionId
						, success: true
						, uid: uid
					} );
					break;





				// a services deregisters itself	
				case "remove":
					if ( this.__services[ message.serviceId ].instances[ connection.getId() ] ){
						if ( this.__services[ message.serviceId ].instances[ connection.getId() ].uid === message.uid ){
							delete this.__services[ message.serviceId ].instances[ connection.getId() ];

							connection.send( {
								context: "service"
								, action: "remove"
								, transactionId: message.transactionId
								, success: true
							} );
						}
						else {
							// failed
							connection.send( {
								context: "service"
								, action: "remove"
								, transactionId: message.transactionId
								, success: false
								, err: "uid_mismatch"
							} );
						}
					}
					else {
						// failed
						connection.send( {
							context: "service"
							, action: "remove"
							, transactionId: message.transactionId
							, success: false
							, err: "nx_service"
						} );
					}
					break;





				// lookup a service
				case "lookup":
					if ( this.__services[ message.serviceId ] &&  Object.keys( this.__services[ message.serviceId ].instances ).length > 0 ){
						connection.send( {
							context: "service"
							, action: "remove"
							, transactionId: message.transactionId
							, success: true
							, services: this.__services[ message.serviceId ].instances
						} );
					}
					else {
						// failed
						connection.send( {
							context: "service"
							, action: "remove"
							, transactionId: message.transactionId
							, success: false
							, err: "nx_service"
						} );
					}
					break;


				default: 
					log.error( "unknown action in message!", this );
					log.dir( message );
			}
		}






		// notification context
		, __handleNotificationMessage: function( message, connection ){
			var uid, i ;


			switch ( message.action ){


				// register a notification request
				case "register":
					if ( ! this.__services[ message.serviceId ] ) this.__services[ message.serviceId ] = { instances: {}, notificationRequests: [] };

					// get an uid for this request
					uid = this.__createId();

					// maybe the service is already online
					if ( Object.keys( this.__services[ message.serviceId ].instances ).length > 0 ){

						// send first the registration confirmation
						process.nextTick( function(){
							connection.send( {
								context: "notification"
								, action: "notify"
								, transactionId: message.transactionId
								, success: true
								, services: this.__services[ message.serviceId ].instances
								, uid: uid
							} );
						}.bind( this ) );
					}
					else {

						// store request
						this.__services[ message.serviceId ].notificationRequests.push( {
						 	connection: connection
						 	, id: connection.getId()
						 	, transactionId: message.transactionId
						 	, uid: uid
						} );

						// remove request if the connection closes
						connection.on( "close", function(){
							var i = this.__services[ message.serviceId ].notificationRequests.length
								, id = connection.getId();

							while( i-- ){
								if ( this.__services[ message.serviceId ].notificationRequests[ i ].id === id ){
									this.__services[ message.serviceId ].notificationRequests.splice( i, 1 );
								}
							}
						}.bind( this ) );
					}

					// register was successfull
					connection.send( {
						context: "notification"
						, action: "register"
						, transactionId: message.transactionId
						, success: true
						, uid: uid
					} );
					break;



				// remove the notification request again
				case "remove": 
					if ( this.__services[ serviceId ] ){
						i = this.__services[ serviceId ].notificationRequests.length;
						while( i-- ){
							if ( this.__services[ serviceId ].notificationRequests[ i ].uid === message.uid ){
								this.__services[ serviceId ].notificationRequests.splice( i, 1 );

								connection.send( {
									context: "notification"
									, action: "remove"
									, transactionId: message.transactionId
									, success: true
								} );

								return;
							}
						}

						// failed
						connection.send( {
							context: "notification"
							, action: "remove"
							, transactionId: message.transactionId
							, success: false
							, err: "no_uid_match"
						} );
					}
					else {
						// failed
						connection.send( {
							context: "notification"
							, action: "remove"
							, transactionId: message.transactionId
							, success: false
							, err: "nx_service"
						} );
					}
					break;



				default: 
					log.error( "unknown action in message!", this );
					log.dir( message );
			}
		}









		// handle a message from the client
		// every message msut have a context, action, transactionId and a serviceId
		, __handleMessage: function( message, connection ){
			if ( message && typeof message.context === "string" && typeof message.action === "string" && typeof message.transactionId === "string" && typeof message.serviceId === "string" ){
				switch ( message.context ){

					// all about services
					case "service":
						this.__handleServiceMessage( message, connection );
						break;

					// all about notifications
					case "notification":
						this.__handleNotificationMessage( message, connection );
						break;

					default: 
						log.error( "unkwnon context in message!", this );
						log.dir( message );
				}
			}
			else {
				log.error( "invalid emssage format!", this );
				log.dir( message );
			}
		}




		// connection close
		, __handleConnectionClose: function(){}


		// conenction error
		, __handleConnectionError: function( err ){
			log.warn( "a connection encountered an error: " + err, this );
			log.trace( err, this );
		}


		// on connection
		, __handleConnection: function( connection ){
			connection.on( "close", this.__handleConnectionClose.bind( this ) );
			connection.on( "error", this.__handleConnectionError.bind( this ) );
			connection.on( "message", this.__handleMessage.bind( this ) );
		}


		// close
		, __handleClose: function(){
			log.error( "the server was closed!", this );
			throw new Error( "the server was closed. the service rendered useless!" );
		}


		// on server listen
		, __handleListen: function(){
			log.info( "the server is ready ...", this );
		}


		// on server errro
		, __handleError: function( err ){
			log.error( "the server encountered an error: " + err, this );
			log.trace( err, this );
		}






		// create a pseudo unique id
		, __createId: function(){
			return this.__serial++, new Buffer( this.__serial + "_" + Date.now() ).toString( "hex" );
		}
	} );
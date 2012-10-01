



	var Class 				= iridium( "class" )
		, log 				= iridium( "log" )
		, argv 				= iridium( "util" ).argv
		, debug 			= argv.has( "trace-all" ) || argv.has( "trace-webservice" )
		, CPUCount 			= argv.get( "threads" ) || ( debug ? 1 : require( "os" ).cpus().length -1 ) || 1 ;

	var SessionManager 		= require( "./master/sessionmanager" );

	var cluster 			= require( "cluster" );



	module.exports = new Class( {

		__instances: {}
		, __respawnDelay: 10000


		, init: function( options ){
			log.info( "starting cluster ....", this );

			this.__respawnDelay = options.respawnDelay;


			this.__sessions = new SessionManager( {
				schema: options.schema.iridium
				, on: {
					ready: function(){
						while( CPUCount-- ) {
							( function( delay ){
								setTimeout( this.__fork.bind( this ), delay );
							}.bind( this ) )( CPUCount * this.__respawnDelay );							
						}
					}.bind( this )

					, broadcast: function( message, excludeId ){
						var keys = Object.keys( this.__instances ), i = keys.length;
						while( i-- ) {							
							if ( keys[ i ] != excludeId ) {
								if ( debug ) log.debug( "sending message to [" + keys[ i ] + "] ...", this );
								this.__instances[ keys[ i ] ].send( message );
							}
							else {
								if ( debug ) log.info( "NOT sending message to [" + keys[ i ] + "] ...", this );
							}
						}
					}.bind( this )

					, message: function( targetId, message ){
						if ( this.__instances[targetId ] ) this.__instances[targetId ].send( message );
					}.bind( this )
				}
			} );	
		}





		, __fork: function(){
			if ( debug ) log.debug( "started a cluster instance ...", this );

			var instance = cluster.fork();

			// child exited ...
			instance.on( "exit", function(){
				delete this.__instances[ instance.uniqueID ];
				setTimeout( this.__fork.bind( this ), this.__respawnDelay );
			}.bind( this ) );

			// got message from instance ...
			instance.on( "message", function( message ){
				this.__sessions.handleMessage( message, instance.uniqueID );
			}.bind( this ) );

			// store reference ( used for messaging )
			this.__instances[ instance.uniqueID ] = instance;
		}

	} );
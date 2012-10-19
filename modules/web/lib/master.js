



	var Class 				= iridium( "class" )
		, log 				= iridium( "log" )
		, argv 				= iridium( "util" ).argv
		, debug 			= argv.has( "trace-all" ) || argv.has( "trace-webservice" )
		, CPUCount 			= argv.get( "threads" ) || ( debug ? 1 : require( "os" ).cpus().length -1 ) || 1 ;

	var SessionManager 		= require( "./worker/sessionmanager" );

	var cluster 			= require( "cluster" );



	module.exports = new Class( {

		__instances: {}
		, __respawnDelay: 10000


		, init: function( options ){
			log.info( "starting cluster ....", this );

			this.__respawnDelay = options.respawnDelay;
			this.__sessions = new SessionManager();

			while( CPUCount-- ) {
				( function( delay ){
					setTimeout( this.__fork.bind( this ), delay );
				}.bind( this ) )( CPUCount * this.__respawnDelay );							
			}	
		}





		, __fork: function(){
			if ( debug ) log.debug( "started a cluster instance ...", this );

			var instance = cluster.fork();

			// child exited ...
			instance.on( "exit", function(){
				delete this.__instances[ instance.uniqueID ];
				setTimeout( this.__fork.bind( this ), this.__respawnDelay );
			}.bind( this ) );

			// store reference ( used for messaging )
			this.__instances[ instance.uniqueID ] = instance;
		}

	} );
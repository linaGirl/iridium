



	var   Class 		= iridium( "class" )
		, Events 		= iridium( "events" )
		, log 			= iridium( "log" )
		, cluster 		= require( "cluster" )
		, os 			= require( "os" );


	var Connection 		= require( "./connection" )
		, Server 		= require( "./server" );



	// distributed models a re loose consistent, cheges will 
	// be propagated to all nodes in the cluster but the sender
	// doesnt wait for it to happen. so there is a small gap
	// of inconsistency which should not be a too big problem
	// in most cases

	module.exports = new ( new Class( {
		inherits: Events


		// remote hosts
		, __hosts: {}

		// the server
		, __server: null
		



		, init: function( options ){



			// if this is a cluster master try conenct to other masters
			if ( cluster.isMaster ) this.__initializeMaster();
		}




		// if the callback is provided the process is consistent
		// payload: 
		// {
		// 	    command: 	"load|unload|update"
		// 	  , schema: 	"databasename"
		// 	  , model: 	    "modelname"
		// 	  , value :{
		// 	  	  i  d: 	33
		// 	  	  , ....
		// 	  }
		// }
		, distiribute: function( payload ){

		}


		, __onData: function( data, source ){

		}


		, __onConnection: function( connection ){
			this.__hosts[ connection.remoteAddress + "@" + connection.remotePort ] = connection;

			connection.on( "data", this.__onData.bind( this ) );

			connection.on( "close", function(){
				if ( this.__hosts[ connection.remoteAddress + "@" + connection.remotePort ] ) delete this.__hosts[ connection.remoteAddress + "@" + connection.remotePort ];
			}.bind( this ) );

			connection.on( "connect", function(){
				this.__hosts[ connection.remoteAddress + "@" + connection.remotePort ] = connection;
			}.bind( this ) );
		}



		, __initializeMaster: function(){
			var config 			= iridium.app.config
				, env 			= config.env
				, nodes 		= config.nodes
				, interfaces 	= []
				, sysnet 		= os.networkInterfaces()
				, keys 			= Object.keys( sysnet ), k = keys.length;


			// get a list of all interfaces
			while( k-- ) {
				if ( Array.isArray( sysnet[ keys [ k ] ] ) ) sysnet[ keys [ k ] ].forEach( function( netif ){ 
					if ( netif && netif.address ) interfaces.push( netif.address );
				} );
			}



			// check if there is a suitable configuration for creating the distributed system
			if ( env && nodes && nodes[ env ] && Array.isArray( nodes[ env ] ) && nodes[ env ].length > 1 ){
				nodes[ env ].forEach( function( node ){ 

					if ( interfaces.indexOf( node.host ) >= 0 ){

						// our server
						this.__server = new Server( {
							  host: 	node.host
							, port: 	node.port
							, on: {
								connection: this.__onConnection.bind( this ) 
							}
						} ).listen();

					}
					else {


						// another server, connect
						var connection = new Connection( {
							  host: 	node.host
							, port: 	node.port
						} );

						// add events, register
						this.__onConnection( connection );

						// connect
						connection.connect();
					}
				}.bind( this ) );
			}
		}
	} ) );
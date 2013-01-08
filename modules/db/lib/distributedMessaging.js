



	var   Class 		= iridium( "class" )
		, Events 		= iridium( "events" )
		, cluster 		= require( "cluster" )
		, os 			= require( "os" )
		, TTLCache 		= require( "./ttlcache" );



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

			// create a ttlcache for storing callbacks ( and let them timeout )
			this.__cache = TTLCache( { ttl: 10000, limit: 100000 } );


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
		, distiribute: function( payload, callback ){

		}



		, __initializeMaster: function(){
			var config 		= iridium.app.config
				, env 		= config.env
				, nodes 	= config.nodes;

			// check if there is a suitable configuration for creating the distributed system
			if ( env && nodes && nodes[ env ] && Array.isArray( nodes[ env ] ) && nodes[ env ].length > 1 ){

			}
		}
	} ) );
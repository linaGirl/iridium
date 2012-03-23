


var Class = iridium( "class" )
	, Events = iridium( "events" )
	, log = iridium( "log" )
	, rpc = iridium.module( "rpc" );





var SSO = module.exports = new Class( {
	$id: "service.sso"
	, Extends: Events


	, constructor: function( options ){

		// service name
		this.__serviceName = options.serviceName;

		// the network interface to this service
		this.__rpc = rpc.createServer( {
			serviceName: this.__serviceName
			, serviceVersion: 1
			, rateLimit: {}				// ratelimit, implemented on the client side
			, replicaCount: 3 			// how many times the data must be stored redundant
			, sharding: true 			// the data is sharded ( stateful data needs to be sharded  sometimes)
		} );


		// replication mechanics
		this.__rpc.replicate( options, callback );
		this.__rpc.on( "replicate", fn.replicateLocal );


		// add the interfaces which are remotely availble
		this.__rpc.defineInterface( {
			name: "getSession"
			, parameters: [
				{
					name: cookie
					, type: rpc.STRING
					, max: 512
				}
			]
			, rateLimit: {}
			, localInterface: this.__getSession.bind( this )
		} );


		this.__rpc.defineInterface();
	}



	// getSession
	, getSession: function( cookie, callback ){
		
	}.defineInterface( this.__rpc, {} )
} );


// iridium-service = sso;


/*
	var service = iridium.module( "service" );

	service.setInstanceCount();

	var SSO = new service.Client( {
		serviceName: "sso"
	} );


	SSO.create( {
		userId: "vandi"
		, password: "atikan"
		, first: ""
		, last: ""
	}, function( err, user ){

	}.bind( this ) );








	var SSOService = module.exports = new service.Service( { 

		  stateful: true	// if true requests from another service will be routed always to the same instance
		, unique: false		// this service can be started only once
		, serviceId: "" 	// unique id for services which arent unique and have multiple instances ( can be used to create tqargeted request on the service )


		, shared: [ "./shared/sso.js" ] // this classes will be loaded on a per process base and shared between the service insatcnes



		// start the service, call callback if ready
		, start: function( callback ) {

		}




		, create: function( options, callback ){

		}



		// shutdown the service, call callback if ready
		, stop: function( callback ){

		}

		// you've got only the current cycle to do what you should do, so asnyc stuff wont be executed!
		, kill: function(){

		}
	} );





*/




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
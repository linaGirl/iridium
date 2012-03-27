	"use strict"
	
	var Socket = require( "./lib/socket" )
		, DirectoryClient = require( "./lib/directoryClient" )
		, HostInfoClient = require( "./lib/hostInfoClient")
		, PubSocket = require( "./lib/pub" )
		, SubSocket = require( "./lib/sub" )
		, RepSocket = require( "./lib/rep" )
		, ReqSocket = require( "./lib/req" );



	var hostInfoClient = global.hostInfoClient = new HostInfoClient().getInfo();
	var directoryClient = new DirectoryClient();



	var net = module.exports = {

		// low level socket implementation on top of zmq sockets
		// do not use until you understand the mechanics!
		Socket: Socket


		// you may instantiate either this classes or use the createSocket function...
		, RepSocket: function( options ) { return options = options || {}, options.directoryClient = directoryClient, options.hostInfoClient = hostInfoClient, new RepSocket( options ); }
		, ReqSocket: function( options ) { return options = options || {}, options.directoryClient = directoryClient, options.hostInfoClient = hostInfoClient, new ReqSocket( options ); }
		, PubSocket: function( options ) { return options = options || {}, options.directoryClient = directoryClient, options.hostInfoClient = hostInfoClient, new PubSocket( options ); }
		, SubSocket: function( options ) { return options = options || {}, options.directoryClient = directoryClient, options.hostInfoClient = hostInfoClient, new SubSocket( options ); }


		// client for directory services
		, DirectoryClient: DirectoryClient

		// client for retreiving hostinfo from host service
		, HostInfoClient: HostInfoClient


		, directoryClient: directoryClient
		, hostInfoClient: hostInfoClient


		// create socket of any type
		, createSocket: function( type, options ){
			options.directoryClient = directoryClient;
			options.hostInfoClient = hostInfoClient;

			 switch ( type ){


			 	case "rep":
			 		return new RepSocket( options );

			 	case "req":
			 		return new ReqSocket( options );

			 	case "pub":
			 		return new PubSocket( options );

			 	case "sub":
			 		return new SubSocket( options );



			 	default:
			 		throw new Error( "unknown socket type!" );
			 }
		}
	};


	

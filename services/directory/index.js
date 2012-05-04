


	

	var Class = iridium( "class" )
		, Events = iridium( "events" )
		, log = iridium( "log" )
		, net = iridium.module( "net" )
		, db = iridium.module( "db" );









	var DirectoryService = module.exports = new Class( {
		$id: "service.Directory"
		, Extends: Events

		, constructor: function( options ) {
			lod.dir( options );

			process.nextTick( function(){
				log.info( "initializing directory service ...", this );

				this.__init();
			}.bind( this ) );
		}




		, __handleMessage: function( message, response ){

		}




		, __init: function(){
			// get the db
			this.__storage = db.MongoDB();
			this.__storage.ensureIndex();
			

			this.__socket = net.createSocket( "rep", {
				bind: "*:3819"
				, on: {
					message: this.__handleMessage.bind( this )
				}
			} );
		}
	} );

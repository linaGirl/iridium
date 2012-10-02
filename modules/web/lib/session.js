
	var Class 			= iridium( "class" )
		, Events 		= iridium( "events" )
		, log 			= iridium( "log" )
		, argv 			= iridium( "util" ).argv
		, debug 		= argv.has( "trace-session" ) || argv.has( "trace-all" );


	var Session 		= require( "./schema/iridium/session" );



	module.exports = new Class( {
		inherits: Session



		// override the models save function ( it saves to the master and not to the db ! )
		, save: function( callback ){
			this.__send( "update", { session: this.toJSON() }, function( err, data ){
				if ( err ) log.error( "failed to save session!" ), log.trace( err );
				if ( callback ) callback( err, data );
			}.bind( this ) );
		}


		// delete myself
		, destroy: function( callback ){
			this.__send( "remove", { session: { id: this.id } }, function( err ){
				this.emit( "destroy" );
				callback( err );
			}.bins( this ) );
		}


		, __send: function( action, payload, callback ){
			this.emit( "message", action, payload, callback );
		}
	} );




	var Class 			= iridium( "class" )
		, Events 		= iridium( "events" )
		, log 			= iridium( "log" );




	module.exports = new Class( {
		$id: "db.mysql.transaction"
		, inherits: Events



		, init: function( options ){
			this.__connection = options.connection;

			this.query( "START TRANSACTION;", function( err, result ){
				if ( err ) this.emit( "error", err );
				else this.emit( "ready" );
			}.bind( this ) );
		}



		, query: function( query, parameters, callback ){
			this.__connection.query( query, parameters, callback );
		}

		, commit: function( callback ){
			this.query( "COMMIT;", function( err, result ){
				if ( callback ) callback( err, result );
				this.emit( "complete" );
				this.off();
			}.bind( this ) );
		}

		, rollback: function( callback ){
			this.query( "ROLLBACK;", function( err, result ){
				if ( callback ) callback( err, result );
				this.emit( "complete" );
				this.off();
			}.bind( this ) );
		}
	} );


	var Class 			= iridium( "class" )
		, Events 		= iridium( "events" )
		, log 			= iridium( "log" )
		, argv 			= iridium( "util" ).argv
		, debug 		= argv.has( "trace-mysql-caching" ) || argv.has( "trace-mysql" ) || argv.has( "trace-all" );


	var Model 			= require( "./model" ); 



	module.exports = new Class( {
		inherits: Model

		, save: function( callback ){
			var isNew = this.isNew(), values = isNew ? this.getValues() : this.getChangedValues();

			this.__proto__.__proto__.__proto__.save.call( this, function( err, instance ){
				if ( process.send && !err ){
					if ( Object.keys( values ).length > 0 ){
						if ( debug ) log.debug( "[ditributedmodel] sending cache message for [" + "dmodel-" + this.__database + "/" + this.__model + "@" + this.id + "], action [" + ( isNew ? "init" : "update" ) + "]: ", this ), log.dir( values );
						process.send( {
							  t: "dmodel-" + this.__databaseName	// topic
							, a: isNew ? "init" : "update" 		// action
							, k: this.id
							, d: values
							, m: this.__model
						} );
					}
				}

				if ( callback ) callback( err, instance );
			}.bind( this ) );
		}

		, isDistributed: function(){ return true; }
	} );
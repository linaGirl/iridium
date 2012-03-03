	


	var Class = require( "./class" )
		, prototype = require( "./prototype" );




	// the standard log storage facility, logs to the screen
	var StdStorageFacility = new Class( {
		$id: "StdStorageFacility"

		
		// debug
		, debug: function( message, source, data ){
			
		}

		// info
		, info: function( message, source, data ){
			
		}

		// warn
		, warn: function( message, source, data ){
			
		}

		// error ( uncatchable )
		, error: function( message, source, data ){
			
		}

		// highlight a message
		, highlight: function( message, source, data ){
			
		}

		// dir an object displaying an optional message
		, dir: function( data, source, message ){
			
		}

		// trace an error displaying an optional message
		, trace: function( err, source, message ){
			
		}
	} );











	// the logger is a singleton
	module.exports = new ( new Class( {
		$id: "log"

		// consturctor
		, constructor: function(){
			this.setStorageFacility( new StdStorageFacility() );
		}

		// set a new facility
		, setStorageFacility: function( facility ){
			this.$facility = facility;
		}



		// debug
		, debug: function( message, source, data ){
			this.$facility.debug( message, source, data );
		}

		// info
		, info: function( message, source, data ){
			this.$facility.info( message, source, data );
		}

		// warn
		, warn: function( message, source, data ){
			this.$facility.warn( message, source, data );
		}

		// error ( uncatchable )
		, error: function( message, source, data ){
			this.$facility.error( message, source, data );
		}



		// highlight a message
		, highlight: function( message, source, data ){
			this.$facility.highlight( message, source, data );
		}



		// dir an object displaying an optional message
		, dir: function( data, source, message ){
			this.$facility.dir( data, source, message );
		}

		// trace an error displaying an optional message
		, trace: function( err, source, message ){
			this.$facility.trace( err, source, message );
		}
	} ) )();
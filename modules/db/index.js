


	var MongoDB = require( "./dep/node-mongolian/mongolian" )
		, log = iridium( "log" );






	module.exports = {

		MongoDB: function( options ){
			try{
				return new MongoDB( {
					log: {
						debug: log.debug.bind( log )
						, info: log.info.bind( log )
						, warn: log.warn.bind( log )
						, error: log.error.bind( log )
					}
				} );
			} catch( e ) {
				log.trace( e );
				process.exit();
			}
		}
	}
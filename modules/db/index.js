


	var MongoDB = require( iridium.path + "modules/db/dep/node-mongolian/mongolian" )
		, mysql = require( iridium.path + "modules/db/dep/node-mysql" )
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

		, MySQL: function( options ){
			return mysql.createClient( options );
		}
	}



	var MongoDB = require( "./dep/node-mongolian/mongolian" )
		, mysql = require( "./dep/node-mysql" )
		, mysqlQueues = require( "./dep/node-mysql-queues" )
		, OrientDB = require( "./lib/orientdb" )
		, MySQLPool = require( "./lib/mysql" )
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

		, OrientDB: OrientDB

		, MySQLPool: MySQLPool

		, MySQL: function( options ){
			var client = mysql.createConnection( options );
			mysqlQueues( client, false );
			return client;
		}
	}
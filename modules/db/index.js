


	var MongoDB 		= require( "./dep/node-mongolian/mongolian" )
		, mysql 		= require( "./dep/node-mysql" )
		, mysqlQueues 	= require( "./dep/node-mysql-queues" )
		, LRUCache 		= require( "./lib/lru" )
		, MySQLPool 	= require( "./lib/mysql" )
		, Model 		= require( "./lib/model" )
		, Schema 		= require( "./lib/schema" )
		, StaticModel 	= require( "./lib/staticmodel" );

	var log 			= iridium( "log" );






	module.exports = {

		MongoDB: function( options ){
			try{
				if ( ! options ) options = { servers: [] };
				if ( ! options.servers ) options.servers = [];
				if ( options.servers.length === 0 ) options.servers.push( { host: "localhost", port: 27018 } );	
						
				options.log = {
					debug: log.debug.bind( log )
					, info: log.info.bind( log )
					, warn: log.warn.bind( log )
					, error: log.error.bind( log )
				};
				return new MongoDB( options );
			} catch( e ) {
				log.trace( e );
				process.exit();
			}
		}


		, MySQLPool: MySQLPool


		, Model: Model
		, StaticModel: StaticModel
		, Schema: Schema



		, LRUCache: LRUCache


		, MySQL: function( options ){
			var client = mysql.createConnection( options );
			mysqlQueues( client, false );
			return client;
		}
	}
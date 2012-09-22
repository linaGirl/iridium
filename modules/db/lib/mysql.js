

	var Class 				= iridium( "class" )
		, Events 			= iridium( "events" )
		, log 				= iridium( "log" )
		, argv 				= iridium( "util" ).argv
		, debug 			= argv.has( "trace-mysql" ) || argv.has( "trace-all" );

	var mysql 				= require( "../dep/node-mysql" );


	var Host 				= require( "./mysqlhost" );


	// mysql db pool with built in transactions
	// the pool establishes as many connections as required, 
	// scales them back if they are idle for n seconds.


	module.exports = new Class( {
		$id: "db.mysql"
		, inherits: Events


		// we need to distinguish writes from reads
		,__reg: null

		
		// the different hosts available
		, __hosts: {}

		, __connections: []

		, __buffer: []


		, init: function( options ){

			// laod hosts, create connections, be ready
			if ( !options.configs ) throw new Error( "missing database configuration!" );
			this.__createHosts( options.configs, options.database );

			this.__reg = /update|insert|delete|grant|create/gi;
			this.__configs = options.configs;


			this.__cleanBuffer();


			// buffer check
			setInterval( this.__checkConnections.bind( this ), 1000 );
		}


		, __checkConnections: function(){
			if ( this.__buffer.length > 0 ){
				this.__createConnection( this.__buffer[ 0 ].writable );
			}
		}



		// dont wait too long for new conenctions ...
		, __cleanBuffer: function(){
			setInterval( function(){
				var now = Date.now() - 5000;
				this.__buffer = this.__buffer.filter( function( item ){
					if ( item.timeout < now ){
						if ( typeof item.callback === "function" ){
							item.callback( new Error( "failed to get a connection from the pool!" ).code = "connection_timeout" );
						}
						return false;
					}
					return true;
				}.bind( this ) );
			}.bind( this ), 1000 );
		}



		, query: function( query, parameters, callback, writable ){
			writable = writable || ( writable === undefined && this.__reg.test( query ) );
			if ( debug ) log.info( "got query ...", this ), log.dir( query, parameters );


			var connection = this.__getConnection( writable );
			if ( connection ){
				if ( debug ) log.debug( "got a free connection for the query ...", this );
				connection.query( query, parameters, callback );
			}
			else {
				if ( debug ) log.debug( "buffering query ...", this );
				this.__buffer.push( { 
					type: 			"query"
					, query: 		query
					, parameters: 	parameters
					, callback: 	callback 
					, writable: 	writable
					, timeout: 		Date.now()
				} );
			}
		}


		// read, use slave connection if available ( prevents usage of the regex )
		, read: function( query, parameters, callback ){
			this.query( query, parameters, callback, false );
		}

		// write, use master conenction ( prevents usage of the regex )
		, write: function( query, parameters, callback ){
			this.query( query, parameters, callback, true );
		}


		, createTransaction: function( callback ){
			var connection = this.__getConnection( true );

			if ( connection ){
				connection.createTransaction( function( err, transaction ){
					if ( err ) this.createTransaction( callback );
					else callback( null, transaction );
				}.bind( this ) );
			}
			else {
				this.__buffer.push( { 
					type: 			"transaction"
					, callback: 	callback 
					, writable: 	true
					, timeout: 		Date.now()
				} );
			}
		}




		, __getConnection: function( writable ){
			var i = this.__connections.length, connection;
			if ( debug ) log.debug( "[" + i + "] existing connections ...", this );

			while( i-- ) {
				if ( ! writable || this.__connections[ i ].isWritable() ) {
					connection = this.__connections.splice( i, 1 )[ 0 ];
					if ( debug ) log.debug( "returning existing connection ...", this );
					if ( connection.isAvailable() )	return connection;
				}
			}

			// there wasnt a suitable connection, create one but not before letting the calling function push 
			// the query to the buffer
			process.nextTick( function(){
				this.__createConnection( writable );
			}.bind( this ) );

			if ( debug ) log.debug( "no existing connection, creating one ...", this );
			return null;
		}


		// when a connection becomes free it will be pushed through this function
		, __setConnection: function( connection ){
			var writable = connection.isWritable()
				, i = this.__buffer.length
				, item;

			if ( debug ) log.debug( "got a free connection ...", this );

			// store connection
			this.__connections.push( connection );
			
			while( i-- ){
				if ( debug ) log.debug( " matching buffer [" + this.__buffer[ i ].writable + "] to connection [" + writable + "] ...", this );
				if ( writable || !this.__buffer[ i ].writable ){
					if ( debug ) log.debug( " executing buffered query ...", this );
					item = this.__buffer.splice( i, 1 )[ 0 ];
					if ( item.type === "query" ){
						this.query( item.query, item.parameters, item.callback );
					}
					else {
						this.createTransaction( item.callback );
					}
					return;
				}
			}
		}



		, __createConnection: function( writable ){
			if ( debug ) log.debug( " creating a new connection ...", this );
			var loadList = [], keys = Object.keys( this.__hosts ), i = keys.length, current;

			while( i-- ){
				current = this.__hosts[ keys[ i ] ];
				if ( current.isAvailable() && ( !writable || current.isWritable() ) ){
					loadList.push( {
						load: current.getLoad()
						, id: keys[ i ]
					} );
				}
			}

			loadList.sort( function( a, b ){
				return a.load > b.load ? 1 : -1 ;
			}.bind( this ) );


			var x = loadList.length;
			while( x-- ) if ( this.__hosts[ loadList[ x ].id ].createConnection() ) return;

			if ( debug ) log.debug( "failed to create new connection!", this );
		}


		
		, __createHosts: function( configs, database ){
			var i = configs.length;

			while( i-- ){
				this.__hosts[ i ] = new Host( {
					id: "h" + i
					, config: {
						  host: 		configs[ i ].host
						, port: 		configs[ i ].port || 3306
						, user: 		configs[ i ].user
						, password: 	configs[ i ].password
						, database: 	database
					}
					, writable: 		configs[ i ].writable
					, weight: 			configs[ i ].weight
					, maxConnections: 	( configs[ i ].maxConnections || 0 )
					, on: {
						connection: function( connection ){
							this.__setConnection( connection );
						}.bind( this )
						, connectionClose: function( connection ){
							this.__connections = this.__connections.filter( function( c ){
								if ( c === connection ){
									if ( debug ) log.debug( "deleting connection from available connections list ...", this );
									return false;
								}
								return true;
							}.bind( this ) );
						}.bind( this )
						, connectionError: function( connection, err ){
							log.error( "connection error: " + err, this );
						}.bind( this )
					}
				} );

				this.__hosts[ i ].createConnection();
			}
		}
	} );
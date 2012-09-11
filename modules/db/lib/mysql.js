

	var Class 				= iridium( "class" )
		, Events 			= iridium( "events" )
		, log 				= iridium( "log" )
		, trace				= iridium( "util" ).argv.has( "trace-mysql" );

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
		}



		, query: function( query, parameters, callback, writable ){
			writable = writable || ( writable === undefined && this.__reg.test( query ) );
			if ( trace ) log.info( "got query ...", this ), log.dir( query, parameters );


			var connection = this.__getConnection( writable );
			if ( connection ){
				if ( trace ) log.debug( "got a free connection for the query ...", this );
				connection.query( query, parameters, callback );
			}
			else {
				if ( trace ) log.debug( "buffering query ...", this );
				this.__buffer.push( { 
					type: 			"query"
					, query: 		query
					, parameters: 	parameters
					, callback: 	callback 
					, writable: 	writable
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
					else callback( transaction );
				}.bind( this ) );
			}
			else {
				this.__buffer.push( { 
					type: 			"transaction"
					, callback: 	callback 
					, writable: 	true
				} );
			}
		}




		, __getConnection: function( writable ){
			var i = this.__connections.length;
			if ( trace ) log.debug( "[" + this.$id + "] has [" + i + "] connections ...", this );

			while( i-- ) {
				if ( ! writable || this.__connections[ i ].isWritable() ) {
					return this.__connections.splice( i, 1 )[ 0 ];
				}
			}

			// there wasnt a suitable connection, create one but not before letting the calling function push 
			// the query to the buffer
			process.nextTick( function(){
				this.__createConnection( writable );
			}.bind( this ) );			
			return null;
		}


		// when a connection becomes free it will be pushed through this function
		, __setConnection: function( connection ){
			var writable = connection.isWritable()
				, i = this.__buffer.length
				, item;

			if ( trace ) log.debug( "[" + this.$id + "] got a free connection from the host ...", this );
			
			while( i-- ){
				if ( writable || !this.__buffer[ i ].writable ){
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

			// store connection
			this.__connections.push( connection );
		}



		, __createConnection: function( writable ){
			if ( trace ) log.debug( "[" + this.$id + "] creating a new connection ...", this );
			var loadList = [], keys = Object.keys( this.__hosts ), i = keys.length, current;

			while( i-- ){
				current = this.__hosts[ keys[ i ] ];
				if ( !writable || current.writable ){
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
					, on: {
						connection: function( connection ){
							this.__setConnection( connection );
						}.bind( this )
						, connectionClose: function( connection ){
							this.__connections = this.__connections.filter( function( c ){ return c !== connection } );
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
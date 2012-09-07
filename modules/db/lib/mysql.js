

	var Class 				= iridium( "class" )
		, Events 			= iridium( "events" )
		, log 				= iridium( "log" );

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


		/*// holds avilable connections to the MySQL master
		, __writeableConnections: []

		// holds read only connections
		, __readOnlyConnections: []


		// waiting read only queries
		, __writeableBuffer: []

		// waiting wrrite queries / transactions
		, __readableBuffer: []*/





		, init: function( options ){
			this.__writeableConnections = [];
			this.__readOnlyConnections = [];
			this.__writeableBuffer = [];
			this.__readableBuffer = [];

			// laod hosts, create connections, be ready
			if ( !options.configs ) throw new Error( "missing database configuration!" );
			this.__prepare( options.configs, options.database );

			this.__reg = /update|insert|delete|grant|create/gi;
			this.__configs = options.configs;
		}



		, query: function( query, parameters, callback, writeable ){
			writeable = writeable || ( writeable === undefined && this.__reg.test( query ) );

			var connection = this.__getConnection( writeable );
			if ( connection ){
				connection.query( query, parameters, callback );
			}
			else {
				if ( writeable ) this.__writeableBuffer.push( { type: "query", query: query, parameters: parameters, callback: callback } );
				else this.__readableBuffer.push( { type: "query", query: query, parameters: parameters, callback: callback } );
				
				this.__createConnection( writeable );
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
				this.__writeableBuffer.push( { type: "transaction", callback: callback } );
				this.__createConnection( true );
			}
		}




		, __getConnection: function( writeable ){
			if ( writeable ){
				if ( this.__writeableConnections.length > 0 ) return this.__writeableConnections.shift();
			} 
			else {
				if ( this.__readOnlyConnections.length > 0 ) return this.__readOnlyConnections.shift();
				if ( this.__writeableConnections.length > 0 ) return this.__writeableConnections.shift();
			}
			return null;
		}

		, __setConnection: function( writeable, connection ){

			if ( writeable ) this.__writeableConnections.push( connection );
			else this.__readOnlyConnections.push( connection );


			if ( writeable && this.__writeableBuffer.length > 0 ){
				var i = this.__writeableBuffer.length, item;
				while( i-- ){
					item = this.__writeableBuffer.shift();
					if ( item.type === "query" ){
						this.query( item.query, item.parameters, item.callback );
					}
					else {
						this.createTransaction( item.callback );
					}
				}
			}
			else if ( this.__readableBuffer.length > 0 ){
				var i = this.__readableBuffer.length, item;
				while( i-- ){
					item = this.__readableBuffer.shift();
					if ( item.type === "query" ){
						this.query( item.query, item.parameters, item.callback );
					}
				}
			}
		}



		, __createConnection: function( writeable ){
			var loadList = [], keys = Object.keys( this.__hosts ), i = keys.length, current;

			while( i-- ){
				current = this.__hosts[ keys[ i ] ];
				if ( !writeable || current.writeable ){
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


		
		, __prepare: function( configs, database ){
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
					, writeable: 		configs[ i ].writeable
					, weight: 			configs[ i ].weight
					, on: {
						connection: function( id, writeable, connection ){
							this.__setConnection( writeable, connection );
						}.bind( this )
						, connectionError: function( id, writeable, connection ){
							if ( writeable ){
								this.__writeableConnections = this.__writeableConnections.filter( function( c ){ return c !== connection } );
							}
							else {
								this.__readOnlyConnections = this.__readOnlyConnections.filter( function( c ){ return c !== connection } );
							}
						}.bind( this )
					}
				} );

				this.__hosts[ i ].createConnection();
			}
		}
	} );
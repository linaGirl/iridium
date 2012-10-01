


	var Class 			= iridium( "class" )
		, Events 		= iridium( "events" )
		, log 			= iridium( "log" );

	var mysql 			= require( "../dep/node-mysql" );

	var Connection 		= require( "./mysqlconnection" );




	module.exports = new Class( {
		$id: "db.mysql.host"
		, inherits: Events


		// all connections of this host
		, __connections: []
	
		// timetamp: if time > this you may try to create new connections 
		, __newConnectionBlock: 0

		// how long to wait until to reconnect when the connection limit of the host is reached
		, __waitTime: 60000 //1m

		// is this db host writable ( master or slave )
		, __writable: false

		// the weight of this host ( load balacing over hosts )
		, __weigth: 1

		// the actual connection configuration
		, __config: {}

		// the maximum of allowed connections to this host, 0 = no limit
		, __maxConnections: 0

		// the minimum amount of connections which should be established
		, __minConnections: 1

		// the actual lod factor this host has ( connections / weight  = load factor)
		, __loadFactor: 0

		// connection counter
		, __connnectionIdCounter: 0

		// buffered connectionrequests
		, __buffer: []

		// id
		, __id: null

		// is this host available
		, __available: true





		, init: function( options ){

			// store configuration
			this.__config.host = options.config.host;
			this.__config.port = options.config.port || 3306;
			this.__config.user = options.config.user;
			this.__config.password = options.config.password;
			this.__config.database = options.config.database;

			// set the id
			this.__id = options.id;

			// additional configuration
			if ( options.maxConnections ) this.__maxConnections = options.maxConnections;
			if ( options.minConnections ) this.__minConnections = options.minConnections;
			if ( options.weight ) this.__weigth = options.weight;
			if ( options.writable ) this.__writable = options.writable;

			// initialize connections ...
			this.__prepare();
		}


		, isWritable: function(){
			return this.__writable;
		}

		, isAvailable: function(){
			return this.__available;
		}

		, getLoad: function(){
			return this.__loadFactor;
		}


		, createConnection: function(){
			return this.__createConnection();
		}


		// try to connect, establish minimu connection count
		, __prepare: function(){
			var i = this.__minConnections;
			while( i-- ) this.__createConnection();
		}



		, __createConnection: function(){
			if ( ( this.__maxConnections === 0 || this.__connections.length <= this.__maxConnections ) && this.__newConnectionBlock < Date.now() ){
				
				// block, do not try to open multiple connections at the same time aka throttling
				this.__available = false;


				this.__connections.push( new Connection( {
					config: 		this.__config
					, writable:  	this.__writable
					, id: 			++this.__connnectionIdCounter + this.__id
					, on: {
						// the connection now availabel for queries
						available: function( connection ){
							this.emit( "connection", connection );
						}.bind( this )

						// the connection could be established, fired once
						, ready: function( connection ){
							this.__addConnection( connection );
							this.__available = true;
						}.bind( this )

						// the connection was closed
						, close: function( connection ){
							this.__removeConnection( connection );
						}.bind( this )

						// the connection could not be established tue too many open connections
						, tooManyConnections: function( connection ){
							this.__newConnectionBlock = Date.now() + this.__waitTime;
							this.__available = false;

							this.__removeConnection( connection );
							
							setTimeout( function(){
								this.__available = true;
							}.bind( this ), this.__waitTime );
						}.bind( this )

						// conenction error
						, error: function( connection, err ){
							this.__newConnectionBlock = Date.now() + 1000;
							this.emit( "connectionError", connection, err );

							this.__available = false;
							setTimeout( function(){
								this.__available = true;
							}.bind( this ), 1000 );
						}.bind( this )

						// can the connection be removed? never close all connections
						, requestRemove: function( callback ){
							callback( this.__connections.length > 1 );
						}.bind( this )
					}
				} ) );
				return true;
			}
			return false;
		}


		, __removeConnection: function( connection ){
			this.__connections = this.__connections.filter( function( c ){ return c !== connection } );
			this.__loadFactor = this.__connections.length / this.__weigth;
			this.emit( "connectionClose", connection );
		}


		, __addConnection: function( connection  ){
			this.__connections.push( connection );
			this.__loadFactor = this.__connections.length / this.__weigth;
		}
	} );
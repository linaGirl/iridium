


	var Class 			= iridium( "class" )
		, Events 		= iridium( "events" )
		, log 			= iridium( "log" );

	var mysql 			= require( "../dep/node-mysql" );

	var Connection 		= require( "./mysqlconnection" );




	module.exports = new Class( {
		$id: "db.mysql.host"
		, inherits: Events


		// all connections of this host
		, __connections: {}

		// connection count
		, __connectionCount: 0 

		// available ( idle ) connections
		, __pool: []

		// status ( available as long connections can be established )
		, __available: true

		// timetamp: if time > this you may try to create new connections 
		, __newConnectionBlock: 0

		// how long to wait until to reconnect when the connection limit of the host is reached
		, __waitTime: 10000

		// is this db host writeable ( master or slave )
		, __writeable: false

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
			if ( options.writeable ) this.__writeable = options.writeable;

			// initialize connections ...
			this.__prepare();
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



		,__createConnection: function( callback ){
			var id = ++this.__connnectionIdCounter + this.__id;

			if ( ( this.__maxConnections === 0 || this.__connectionCount >= this.__maxConnections ) && this.__newConnectionBlock < Date.now() ){
				
				this.__connections[ id ] = new Connection( {
					config: this.__config
					, id: id
					, on: {
						available: function( id, connection ){
							this.emit( "connection", this.__id, this.__writeable, connection );
						}.bind( this )


						, busy: function( id, connection ){

						}.bind( this )


						, tooManyConnections: function( id, connection ){
							this.__newConnectionBlock = Date.now() + this.__waitTime;
						}.bind( this )


						, idleTimeout: function( id, connection ){
							this.__connectionCount--;
							this.__loadFactor = this.__connectionCount / this.__weigth;
							this.emit( "connectionError", this.__id, this.__writeable, connection );
							delete this.__connections[ id ];
						}.bind( this )


						, error: function( id, connection ){							
							this.__newConnectionBlock = Date.now() + 1000;
							this.__connectionCount--;
							this.__loadFactor = this.__connectionCount / this.__weigth;
							this.emit( "connectionError", this.__id, this.__writeable, connection );
							delete this.__connections[ id ];
						}.bind( this )
					}
				} );

				this.__connectionCount++;
				this.__loadFactor = this.__connectionCount / this.__weigth;

				return this.__connections[ id ];
			}
			return null;
		}
	} );
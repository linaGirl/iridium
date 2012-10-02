


	var Class 			= iridium( "class" )
		, Events 		= iridium( "events" )
		, log 			= iridium( "log" ); 



	module.exports = new Class( {
		$id: "model"
		, inherits: Events


		, errors: false

		// was the record oaded from the db?
		, __isFromDB: false

		// are ther changed values ?
		, __changed: []
		, __values: {}





		// fill model with data
		, init: function( options ){
			var keys = Object.keys( options ), i = keys.length;


			// create getters && setters
			this.__initModel();

			// set initial values
			while( i-- ){
				if ( keys[ i ][ 0 ] !== "$" ){
					if ( options.$fromDB ){
						this.__values[ keys[ i ] ] = options[ keys[ i ] ];
					}
					else {
						this[ keys[ i ] ] = options[ keys[ i ] ];
					}
				} 
			}

			if ( options.$fromDB ) 	this.__isFromDB 	= true;
			if ( options.$db ) 		this.__db 			= options.$db;
			if ( options.$dbName ) 	this.__databaseName = options.$dbName;
			if ( options.$model ) 	this.__model 		= options.$model;
		}



		// create getters and setters for the properties
		, __initModel: function(){
			if ( this.__properties ){
				var keys = Object.keys( this.__properties ), i = keys.length;

				while( i-- ){
					( function( key ){
						if ( this.__properties[ key ] !== null && typeof this.__properties[ key ] === "object" ){
							if ( typeof this.__properties[ key ].set === "function" ){
								this.__defineSetter__( key, this.__properties[ key ].set.bind( this ) );
							}
							else {
								this.__defineSetter__( key, function( value ){
									this.__values[ key ] = value;
									if ( this.__changed.indexOf( key ) === -1 ) this.__changed.push( key );
								}.bind( this ) );
							}
							
							if ( typeof this.__properties[ key ].get === "function" ){
								this.__defineGetter__( key, this.__properties[ key ].get.bind( this ) );
							}
							else {
								this.__defineGetter__( key, function( value ){
									this.__values[ key ] = value;
									if ( this.__changed.indexOf( key ) === -1 ) this.__changed.push( key );
								}.bind( this ) );
							}

							if ( this.__properties[ key ].hasOwnProperty( "value" ) ) this.__values[ key ] = this.__properties[ key ].value;
						}
						else {
							this.__defineSetter__( key, function( value ){
								this.__values[ key ] = value;
								if ( this.__changed.indexOf( key ) === -1 ) this.__changed.push( key );
							}.bind( this ) );

							this.__defineGetter__( key, function(){ return this.__values[ key ]; }.bind( this ) );

							this.__values[ key ] = this.__properties[ key ];
						}
					}.bind( this ) )( keys[ i ] );
				}
			}
		}


		// you may execute operations on a transaction
		, setTransaction: function( transaction ){
			this.__transaction = transaction;
			transaction.on( "complete", function(){
				delete this.__transaction;
			}.bind( this ) );
		}


		, isNew: function(){
			return !this.__isFromDB;
		}


		, save: function( callback ){
			var updates = [],  values = [], val = [],  i = this.__changed.length;

			if ( this.__isFromDB ){
				if ( this.__changed.length === 0 ){
					callback();
				}
				else {
					while( i-- ){
						updates.push( this.__changed[ i ] + " = ?" );
						values.push( this.__values[ this.__changed[ i ] ] );
					}
					values.push( this.id );
					( this.__transaction || this.__db ).query( "UPDATE " + this.__databaseName + "." + this.__model + " SET " + updates.join( ", " ) + " WHERE id = ? LIMIT 1;", values, function( err, result ){
						if ( err ){
							log.trace( err );
						}
						else {
							this.__changed = [];
						}
						if ( callback ) callback( err );
					}.bind( this ) );
				}
			}
			else {
				while( i-- ){
					values.push( this.__values[ this.__changed[ i ] ] );
					updates.push( this.__changed[ i ] );
					val.push( "?" );
				}
				
				// create new
				( this.__transaction || this.__db ).query( "INSERT INTO " + this.__databaseName + "." + this.__model + " (" + updates.join( "," ) + ") VALUES (" + val.join( ", " ) + ");", values, function( err, result ){
					if ( err ){
						log.trace( err );
					}
					else {
						this.__isFromDB = true;
						this.__id = this.id || result.insertId;
						this.__changed = [];
					}
					if ( callback ) callback( err );
				}.bind( this ) );
			}

			return this;
		}




		, toJSON: function(){
			var keys = Object.keys( this ), i = keys.length, result = {};
			while( i-- ) {
				if ( this.__lookupGetter__( keys[ i ] ) ) {
					result[ keys[ i ] ] = this[ keys[ i ] ];
				}
			} 
			return result;
		}
	} );
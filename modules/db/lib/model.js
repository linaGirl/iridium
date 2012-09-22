


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




		, __isNumber: function( input ){
			return !isNaN( input );
		}

		, __isHex: function( input ){
			return /^[0-9a-f]*$/gi.test( input );
		}




		// fill model with data
		, init: function( options ){
			var keys = Object.keys( options ), i = keys.length;

			while( i-- ){
				if ( keys[ i ][ 0 ] !== "$" ){
					if ( options.$fromDB ){
						this[ "__" + keys[ i ] ] = options[ keys[ i ] ];
					}
					else {
						this[ keys[ i ] ] = options[ keys[ i ] ];
					}
				} 
			}

			if ( options.$fromDB ) 	this.__isFromDB 	= true;
			if ( options.$db ) 		this.__db 			= options.$db;
			if ( options.$dbName ) 	this.__databaseName = options.$dbName;
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
						values.push( this[ this.__changed[ i ] ] );
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
					values.push( this[ this.__changed[ i ] ] );
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
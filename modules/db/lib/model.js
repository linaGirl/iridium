


	var Class 			= iridium( "class" )
		, Events 		= iridium( "events" )
		, log 			= iridium( "log" ); 



	var Model = module.exports = new Class( {
		inherits: Events

		// was the record oaded from the db?
		, __isFromDB: false

		// chnaged fields
		, __changed: []

		// the actual field values
		, __values: {}

		// column definitions
		, __columns: {}

		// primary columns
		, __primary: {}


		, "static REFERENCE_TYPE_MANY": "many"
		, "static REFERENCE_TYPE_ONE": "one"



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

			if ( options.$fromDB || options.$cache ) 	this.__isFromDB 	= true;
			if ( options.$db ) 		this.__db 			= options.$db;
			if ( options.$dbName ) 	this.__databaseName = options.$dbName;
			if ( options.$model ) 	this.__model 		= options.$model;
		}



		, getChangedValues: function(){
			var i = this.__changed.length
				, values = {};

			while( i-- ) values[ this.__changed[ i ] ] = this.__values[ this.__changed[ i ] ];
			return values;
		}

		, getValues: function(){
			return this.__values;
		}


		, isDistributed: function(){ return false; }


		// create getters and setters for the columns
		, __initModel: function(){
			if ( this.__columns ){
				var keys = Object.keys( this.__columns ), i = keys.length;

				while( i-- ){
					( function( columnName ){

						// store only changes				
						this.__defineSetter__( columnName, function( value ){
							if ( this.__values[ columnName ] !== value && this.__changed.indexOf( columnName ) === -1 ) this.__changed.push( columnName );
							this.__values[ columnName ] = value;
						}.bind( this ) );

						// return the value
						this.__defineGetter__( columnName, function(){ return this.__values[ columnName ]; }.bind( this ) );

						// store primary key referenc
						if ( this.__columns[ columnName ].isPrimary ) this.__primary[ columnName ] = null;
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


		, delete : function( callback ){
			var where, keys, k, whereConditions = [], values = [];

			// create where 
			if ( this.__primary ){
				var keys = Object.keys( this.__primary ), k = keys.length;
				while( k-- ){
					whereConditions.push( keys[ k ] + " = ?" );
					values.push( this.__values[ keys[ k ] ] );
				}
				where = "WHERE " + whereConditions.join( " AND " );
			}
			else{
				where = "WHERE id = ?";
				values.push( this.id );
			}

			( this.__transaction || this.__db ).query( "DELETE FROM " + this.__databaseName + "." + this.__model + " " + where + " LIMIT 1;", values, function( err, result ){
				if ( err ) log.trace( err );
				else this.__changed = [];
				if ( callback ) callback( err );
			}.bind( this ) );
		}


		, save: function( callback ){
			var updates = [],  values = [], val = [],  i = this.__changed.length, where, keys, k, whereConditions = [];
			if ( this.__isFromDB ){
				if ( this.__changed.length === 0 ){
					if ( callback ) callback();
				}
				else {
					while( i-- ){
						updates.push( "`" + this.__changed[ i ] + "` = ?" );
						values.push( this.__values[ this.__changed[ i ] ] );
					}
					

					// create where 
					if ( this.__primary ){
						var keys = Object.keys( this.__primary ), k = keys.length;
						while( k-- ){
							whereConditions.push( "`" + keys[ k ] + "` = ?" );
							values.push( this.__values[ keys[ k ] ] );
						}
						where = "WHERE " + whereConditions.join( " AND " );
					}
					else{
						where = "WHERE `id` = ?";
						values.push( this.id );
					}


					( this.__transaction || this.__db ).query( "UPDATE " + this.__databaseName + "." + this.__model + " SET " + updates.join( ", " ) + " " + where + " LIMIT 1;", values, function( err, result ){
						if ( err ) log.trace( err );
						else this.__changed = [];

						if ( callback ) callback( err, this );
					}.bind( this ) );
				}
			}
			else {
				while( i-- ){
					values.push( this.__values[ this.__changed[ i ] ] );
					updates.push( "`" + this.__changed[ i ] + "`" );
					val.push( "?" );
				}
				
				// create new
				( this.__transaction || this.__db ).query( "INSERT INTO " + this.__databaseName + "." + this.__model + " (" + updates.join( "," ) + ") VALUES (" + val.join( ", " ) + ");", values, function( err, result ){
					
					if ( err ){
						log.trace( err );
					}
					else {
						this.__isFromDB = true;
						if ( result.insertId ) this.id = result.insertId;
						this.__changed 	= [];
					}
					if ( callback ) callback( err, this );
				}.bind( this ) );
			}

			return this;
		}


		// got data from other node ...
		, synchronize: function( data ){
			data = data || {};
			var keys = Object.keys( data ), k = keys.length;
			while( i-- ) this[ keys[ k ] ] = data[ keys[ k ] ];
		}


		// serialize
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
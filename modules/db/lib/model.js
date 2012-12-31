


	var Class 			= iridium( "class" )
		, Events 		= iridium( "events" )
		, log 			= iridium( "log" ); 



	var Model = module.exports = new Class( {
		inherits: Events


		, errors: false

		// was the record oaded from the db?
		, __isFromDB: false

		// are ther changed values ?
		, __changed: []
		, __values: {}
		, __primary: {}
		, __relations: {}
		, __properties: {}
		, __relatedRecords: {}
		, __foreignKeys: []
		, __foreignRecords: []


		, PRIMARY: "$$__iridium_primary__$$"
		, FK: "$$__iridium_fk__$$"


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

			if ( Object.keys( this.__relations ).length > 0 ) this.__hasRelations = true;
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


		, hasForeignKeys: function(){
			return !!this.__hasFK;
		}

		, getForeignKeys: function(){
			return 
		}

		, hasRelations: function(){
			return !!this.__hasRelations;
		}

		, getRelations: function(){
			return this.__relations;
		}

		, touchRelatedRecord: function( id ){
			if ( ! this.__relatedRecords[ id ] ) this.__relatedRecords[ id ] = [];
		}

		, addRelatedRecord: function( id, record ){
			if ( ! this.__relatedRecords[ id ] ) this.__relatedRecords[ id ] = [];
			this.__relatedRecords[ id ].push( record );
		}

		, getProperties: function(){
			return this.__properties;
		}

		, isDistributed: function(){ return false; }

		// create getters and setters for the properties
		, __initModel: function(){
			if ( this.__properties ){
				var keys = Object.keys( this.__properties ), i = keys.length;

				while( i-- ){
					( function( key ){						
						this.__defineSetter__( key, function( value ){
							if ( this.__values[ key ] !== value && this.__changed.indexOf( key ) === -1 ) this.__changed.push( key );
							this.__values[ key ] = value;
						}.bind( this ) );

						this.__defineGetter__( key, function(){ return this.__values[ key ]; }.bind( this ) );

						this.__values[ key ] = this.__properties[ key ];

						// primary?
						if ( this.__properties[ key ] === Model.PRIMARY ){
							this.__primary[ key ] = null;
						}

						// foreign ?
						if ( this.__properties[ key ] === Model.FK ) {
							this.__hasFK = true;
							this.__foreignKeys.push( key );
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
						
						if ( err ){
							log.trace( err );
						}
						else {
							this.__changed = [];
						}
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



	var Class 			= iridium( "class" )
		, Events 		= iridium( "events" )
		, log 			= iridium( "log" ); 




	var StaticModel = new Class( {
		$id: "Model"

		, init: function( options ){
			this.__db 		= options.db;
			this.__database = options.database;
			this.__model 	= options.model;
			this.__class 	= options.cls;

			this.__from 	= options.database + "." + options.model;
		}



		, update: function( id, updates, callback ){
			if ( ! updates ) return callback(); // no updates
			var keys = Object.keys( updates ), i = keys.length, fields = [], values = [];
			if ( i === 0 ) return callback(); // no updates

			while( i-- ){
				fields.push( keys[ i ] + " = ?" );
				values.push( updates[ keys[ i ] ] );
			}
			values.push( id );

			this.__db.query( "UPDATE " + this.__from + " SET " + fields.join( ", " ) + " WHERE id = ? LIMIT 1;", values, callback );
		}	



		, remove: function( id, callback ){
			this.__db.query( "DELETE FROM " + this.__from + " WHERE id = ? LIMIT 1;", [ id ], callback );
		}



		, findOne: function( key, value, callback ){
			var parameters = []
				, queries = []
				, type = typeof key
				, keys, i ;


			if ( type === "string" ){
				if ( typeof value === "function" ){
					callback = value;
					value = undefined;
					queries.push( "id = ?" );
					parameters.push( key );
				}
				else {
					queries.push( key + " = ?" );
					parameters.push( value );
				}
			}
			else if ( type === "object" ){
				callback = value;
				value = undefined;
				keys = Object.keys( key ), i = keys.length;
				while( i-- ) {
					queries.push( keys[ i ] + " = ?" );
					parameters.push( key[ keys[ i ] ] );
				}
			}
			else {
				throw new Error( "invalid input!" );
			}


			this.__db.query( "SELECT * FROM " + this.__from + " WHERE " + queries.join( " AND " ) + " LIMIT 1;", parameters, function( err, result ){
				 if ( err ){
				 	callback( err );
				 } 
				 else if( result.length === 1 ){
				 	var instanceOptions = {
				 		  $fromDB: 	true
		 				, $db: 		this.__db
		 				, $dbName: 	this.__database
		 				, $model: 	this.__model
				 	};

				 	var keys = Object.keys( result[ 0 ] ), i = keys.length;
				 	while( i-- ){
				 		instanceOptions[ keys[ i ] ] = result[ 0 ][ keys[ i ] ];
				 	}
				 	callback( null, new this.__class( instanceOptions ) );
				 }
				 else {
				 	callback( null );
				 }
			}.bind( this ) );
		}		



		, fetchAll: function( callback ){
			this.__db.query( "SELECT * FROM " + this.__from + ";", function( err, list ){
				if ( err || !list ) callback( err );
				else {
					var i = list.length, result = [];
					while( i-- ) {
						( function( index ){
					 		var opts = {
					 			  $fromDB: 	true
				 				, $db: 		this.__db
				 				, $dbName: 	this.__database
		 						, $model: 	this.__model
					 		};

					 		var keys = Object.keys( list[ index ] ), k = keys.length;
						 	while( k-- ){
						 		opts[ keys[ k ] ] = list[ index ][ keys[ k ] ];
						 	}

						 	result.push( new this.__class( opts ) );
					 	}.bind( this ) )( i );
					}

					callback( null, result );
				}
			}.bind( this ) );
		}		


		, find: function( parameters, callback ){
			var queries 	= []
				, values 	= []
				, keys 		= Object.keys( parameters.query )
				, i 		= keys.length;

			while( i-- ){
				queries.push( keys[ i ] + " = ?" );
				values.push( parameters.query[ keys[ i ] ] );
			}

			if ( !parameters.limit ) parameters.limit = [ 0, 100 ];
			values = values.concat( parameters.limit );

			this.__db.query( "SELECT * FROM " + this.__from + " WHERE " + queries.join( " AND " ) + " LIMIT ?, ?;", values, function( err, result ){
				if ( err ){
					callback( err );
				} 
				else if( result.length > 0 ){
				 	var records = [], i = result.length;

				 	while( i-- ){
					 	( function( index ){
					 		var opts = {
					 			  $fromDB: 	true
				 				, $db: 		this.__db
				 				, $dbName: 	this.__database
		 						, $model: 	this.__model
					 		};

					 		var keys = Object.keys( result[ index ] ), k = keys.length;
						 	while( k-- ){
						 		opts[ keys[ k ] ] = result[ index ][ keys[ k ] ];
						 	}

						 	records.push( new this.__class( opts ) );
					 	}.bind( this ) )( i );
					 }

				 	callback( null, records );
				 }
				 else {
				 	callback( null, [] );
				 }
				}.bind( this ) );
			}			
		}
	 );



	

	
	module.exports = function( cOptions ){

		// create instance of the static model
		var staticmodel = new StaticModel( cOptions );

		// creaate a contructor proxy
		var contructor = function( options ){
			options 			= options || {};
			options.$db 		= cOptions.db;
			options.$dbName 	= cOptions.database;
			options.$model 		= cOptions.model;

			return new cOptions.cls( options );
		}

		// apply static methods on the constructor proxy
		contructor.findOne 	= staticmodel.findOne.bind( staticmodel );
		contructor.find 	= staticmodel.find.bind( staticmodel );
		contructor.update 	= staticmodel.update.bind( staticmodel );
		contructor.remove 	= staticmodel.remove.bind( staticmodel );
		contructor.fetchAll	= staticmodel.fetchAll.bind( staticmodel );


		return contructor;
	}

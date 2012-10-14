


	var Class 			= iridium( "class" )
		, Events 		= iridium( "events" )
		, log 			= iridium( "log" )
		, Waiter 		= iridium( "util" ).Waiter; 




	var StaticModel = new Class( {
		
		
		init: function( options ){
			this.__db 		= options.db;
			this.__database = options.database;
			this.__model 	= options.model;
			this.__class 	= options.cls;

			this.__from 	= options.database + "." + options.model;

			// need to get to the model config which is on the class config
			this.__sample  	= new options.cls();
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
			var config = {}, query;

			if ( typeof key === "string" ){
				if ( typeof value === "function" ){
					callback = value;
					config.id = key;
				}
				else {
					config[ key ] = value;
				}
			}
			else {
				config = key;
				callback = value;
			}

			query = this.__prepareQuery( config );

			this.__db.query( "SELECT * FROM " + this.__from + " WHERE " + query.queries.join( " AND " ) + " LIMIT 1;", query.values, function( err, result ){
				 if ( err ) callback( err );
				 else if( result.length === 1 ){
				 	this.__loadModel( result[ 0 ], function( err, instance ){
		 				if ( err ) callback( err );
		 				else callback( null, instance );
		 			}.bind( this ) );
				 }
				 else callback();
			}.bind( this ) );
		}		



		, fetchAll: function( callback ){
			this.__db.query( "SELECT * FROM " + this.__from + ";", function( err, list ){
				if ( err || !list ) callback( err );
				else {
					var i = list.length, records = [], waiter = new Waiter();

					while( i-- ) {
						( function( index ){
							waiter.add( function( cb ){
					 			this.__loadModel( list[ index ], function( err, instance ){
					 				if ( err ) waiter.cancel( err );
					 				else {
					 					records.push( instance );
					 					cb();
					 				}
					 			}.bind( this ) );
					 		}.bind( this ) );
					 	}.bind( this ) )( i );
					}

					waiter.start( function( err ){
			 			if ( err ) callback( err );
			 			else callback( null, records );
			 		}.bind( this ) );	
				}
			}.bind( this ) );
		}		


		, find: function( parameters, callback ){
			var query = this.__prepareQuery( parameters );

			this.__db.query( "SELECT * FROM " + this.__from + " WHERE " + query.queries.join( " AND " ) + ";", query.values, function( err, result ){
				if ( err ) callback( err );
				else if( result.length > 0 ){
				 	var records = [], i = result.length, waiter = new Waiter();

				 	while( i-- ){
					 	( function( index ){
					 		waiter.add( function( cb ){
					 			this.__loadModel( result[ index ], function( err, instance ){
					 				if ( err ) waiter.cancel( err );
					 				else {
					 					records.push( instance );
					 					cb();
					 				}
					 			}.bind( this ) );
					 		}.bind( this ) );	
					 	}.bind( this ) )( i );
					 }

				 	waiter.start( function( err ){
			 			if ( err ) callback( err );
			 			else callback( null, records );
			 		}.bind( this ) );	
				}
				else {
				 	callback( null, [] );
				}
			}.bind( this ) );
		}



		, __loadModel: function( record, callback ){
			var keys, k, rKeys, r, relations, waiter, instance, opts = {
	 			  $fromDB: 	true
 				, $db: 		this.__db
 				, $dbName: 	this.__database
				, $model: 	this.__model
	 		};

	 		// set values
	 		keys = Object.keys( record );
	 		k = keys.length;

		 	while( k-- ) opts[ keys[ k ] ] = record[ keys[ k ] ];

		 	// create insatnce
		 	instance = new this.__class( opts );

		 	// cehk relations
		 	if ( this.__sample.hasRelations() ){
		 		relations = this.__sample.getRelations();
		 		waiter = new Waiter();

		 		rKeys = Object.keys( relations );
		 		r = rKeys.length;
		 		while( r-- ){
		 			if ( relations[ rKeys[ r ] ] ){
			 			( function( key ){
			 				waiter.add( function( cb ){
			 					this.__db.query( "SELECT " + key + ".* FROM " + this.__database + "." + this.__model + "_" + key + " rel JOIN " + this.__database + "." + key + " entity ON entity.id = rel.id_" + key + " WHERE rel.id_" + this.__model + " = ?;", [ record.id ], function( err, relatedRecords ){
			 						if ( err ) waiter.cancel( err );
			 						else {
			 							instance.touchRelatedRecord( key );

			 							if ( relatedRecords ){
			 								var x = relatedRecords.length;
			 								while( x-- ) {
			 									relatedRecords[ x ].$fromDB = true;
			 									relatedRecords[ x ].$db = this.__db;
			 									relatedRecords[ x ].$dbName = this.__database
			 									relatedRecords[ x ].$model = key;

			 									instance.addRelatedRecord( key, new this.__db[ key ]( relatedRecords[ x ] ) );
			 								}
			 							}
			 							cb();
			 						}
			 					}.bind( this ) );
			 				}.bind( this ) );
			 			}.bind( this ) )( pKeys[ p ] );
			 		}	 			
		 		}

		 		waiter.start( function( err ){
		 			callback( err, instance );
		 		}.bind( this ) );
		 	}
		 	else {
		 		callback( null, instance );
		 	}
		}


		, __prepareQuery: function( config ){
			var   queries 	= []
				, values 	= []
				, keys 		= Object.keys( config )
				, i 		= keys.length;



			while( i-- ){
				if ( typeof config[ keys[ i ] ] === "object" && config[ keys[ i ] ] !== null ){
					if ( config[ keys[ i ] ].in ){
						if ( config[ keys[ i ] ].in.length > 0 ){
							queries.push( this.__db.escape( keys[ i ] ) + " IN ( ?" + new Array( config[ keys[ i ] ].in.length ).join( ", ?" ) + " )" );
							values = values.concat( config[ keys[ i ] ].in );
							//console.log( "SELECT * FROM " + this.__from + " WHERE " + queries.join( " AND " ) + ";", values);
						}						
					}
					else throw new Error( "unknwown query format!" );
				}
				else {
					queries.push( keys[ i ] + " = ?" );
					values.push( config[ keys[ i ] ] );
				}				
			}

			return { queries: queries, values: values };
		}


		, __createJoins: function(){
			if ( this.__sample.hasForeignKeys() ){
				var fks = this.__sample.getForeignKeys();
			}
			return null;
		}
	} );



	

	
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

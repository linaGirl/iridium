


	var Class 			= iridium( "class" )
		, Events 		= iridium( "events" )
		, log 			= iridium( "log" )
		, Waiter 		= iridium( "util" ).Waiter
		, LRUCache 		= require( "./lru" )
		, argv 			= iridium( "util" ).argv
		, debug 		= argv.has( "trace-mysql-caching" ) || argv.has( "trace-mysql" ) || argv.has( "trace-all" );


	var classConstructors = {};


	var StaticModel = new Class( {
		

		  PRIMARY: "$$__iridium_primary__$$"
		, FK: "$$__iridium_fk__$$"
		

		, init: function( options ){
			this.__db 		= options.db;
			this.__database = options.database;
			this.__model 	= options.model;
			this.__class 	= options.cls;

			this.__from 	= options.database + "." + options.model;

			// need to get to the model config which is on the class config
			this.__sample  	= new options.cls();

			// create cache?
			if ( this.isDistributed() ){
				this.__cache = new LRUCache( {
					  ttl: 		this.getCacheTTL()
					, limit: 	this.getCacheLimit()
				} );
			}
		}


		, cacheInstruction: function( action, key, data ){
			if ( this.__cache ) {
				if ( action === "init" ){
					data.$fromDB = true;
					data.$cache = true;
					var instance = new classConstructors[ this.__model ]( data );
					this.__cache.set( key, instance );
				}
				else if ( action === "update" ){
					if ( this.__cache.has( key ) ){
						this.__cache.get( key ).synchronize( data );
					}
				}
			}
		}


		, isDistributed: function(){
			return this.__sample.isDistributed();
		}


		, getCacheTTL: function(){
			if ( this.__sample.cache ) return this.__sample.cache.ttl || 10 * 60 * 1000;
			return 10 * 60 * 1000
		}

		, getCacheLimit: function(){
			if ( this.__sample.cache ) return this.__sample.cache.limit || 10000;
			return 10000
		}


		, update: function( config, updates, callback ){
			var where, keys, k, whereConditions = [], values = [], updateConditions = [];

			// create update
			keys = Object.keys( updates ), k = keys.length;
			while( k-- ){
				updateConditions.push( keys[ k ] + " = ?" );
				values.push( updates[ keys[ k ] ] );
			}


			// create where 
			if ( typeof config === "object" && config !== null ){
				keys = Object.keys( config ), k = keys.length;
				while( k-- ){
					whereConditions.push( keys[ k ] + " = ?" );
					values.push( config[ keys[ k ] ] );
				}
				where = "WHERE " + whereConditions.join( " AND " );
			}
			else{
				where = "WHERE id = ?";
				values.push( config );
			}


			this.__db.query( "UPDATE " + this.__from + " SET " + updateConditions.join( ", " ) + " " + where + " LIMIT 1;", values, callback );
		}	



		, remove: function( config, callback ){
			var where, keys, k, whereConditions = [], values = [];

			// create where 
			if ( typeof config === "object" && config !== null ){
				keys = Object.keys( config ), k = keys.length;
				while( k-- ){
					whereConditions.push( keys[ k ] + " = ?" );
					values.push( config[ keys[ k ] ] );
				}
				where = "WHERE " + whereConditions.join( " AND " );
			}
			else{
				where = "WHERE id = ?";
				values.push( config );
			}

			this.__db.query( "DELETE FROM " + this.__from + " " + where + " LIMIT 1;", values, callback );
		}



		, findOne: function( key, value, callback ){
			var config = {}, query;

			if ( typeof key !== "object" ){
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

			// check cache?
			if ( config && config.id && this.isDistributed() && this.__cache.has( config.id ) ) return callback( null, this.__cache.get( config.id ) );


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
			var query = this.__renderQuery( parameters );

			this.__db.query( query.query, query.parameters, function( err, result ){
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

		 	// cacheing
		 	if ( this.isDistributed() ){
		 		this.__cache.set( instance.id, instance );
		 		if ( debug ) log.debug( "[staticmodel] sending cache message for [dmodel-" + this.__database + "/" + this.__model + "@" + instance.id + "], action [init]: ", this ), log.dir( instance.getValues() );

		 		process.send( {
					  t: "dmodel-" + this.__database
					, a: "init"
					, k: instance.id
					, d: instance.getValues()
					, m: this.__model
				} );
		 	}

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




		, __renderQuery: function( config ){
			var query = this.__prepareQuery( config ), limit = "", select = "*", where = "", order = "", group = "";

			if ( query.queries.length > 0 ){
				where = " WHERE " + query.queries.join( " AND " );
			}
			if ( query.order ){
				order = " ORDER BY " + query.order;
			}
			if ( query.group ){
				group = " GROUP BY " + query.group;
			}
			if ( query.limit !== undefined && query.offset !== undefined ){
				limit = " LIMIT ?, ?";
				query.values.push( query.offset, query.limit );
			}
			if ( query.select ) select = query.select;

			return { query: "SELECT " + select + " FROM " + this.__from + where + group + order + limit + ";", parameters: query.values }; 
		}


		, __prepareQuery: function( config ){
			var   queries 	= []
				, values 	= []
				, keys 		= Object.keys( config )
				, i 		= keys.length
				, result 	= {};



			while( i-- ){
				if ( keys[ i ] === "$limit" ){
					result.limit = config[ keys[ i ] ];
				}
				else if ( keys[ i ] === "$offset" ){
					result.offset = config[ keys[ i ] ];
				}
				else if ( keys[ i ] === "$select" ){
					result.select = config[ keys[ i ] ].join( ", " );
				}
				else if ( keys[ i ] === "$order" ){
					result.order = config[ keys[ i ] ].join( ", " );
				}				
				else if ( keys[ i ] === "$group" ){
					result.group = config[ keys[ i ] ].join( ", " );
				}
				else if ( typeof config[ keys[ i ] ] === "object" && config[ keys[ i ] ] !== null && !config[ keys[ i ] ].toISOString ){
					if ( config[ keys[ i ] ].in ){
						if ( config[ keys[ i ] ].in.length > 0 ){
							queries.push( this.__db.escapeField( keys[ i ] ) + " IN ( ?" + new Array( config[ keys[ i ] ].in.length ).join( ", ?" ) + " )" );
							values = values.concat( config[ keys[ i ] ].in );
							//console.log( "SELECT * FROM " + this.__from + " WHERE " + queries.join( " AND " ) + ";", values);
						}						
					}
					else if ( config[ keys[ i ] ].hasOwnProperty( "like" ) ){
						if ( typeof config[ keys[ i ] ].like === "string" && config[ keys[ i ] ].like.length > 0 ){
							queries.push( this.__db.escapeField( keys[ i ] ) + " LIKE ?" );
							values = values.concat( config[ keys[ i ] ].like );
						}
					}
					else throw new Error( "unknwown query format [" + keys[ i ] + "][" + typeof config[ keys[ i ] ] + "]!" );
				}
				else {
					queries.push( keys[ i ] + " = ?" );
					values.push( config[ keys[ i ] ] );
				}				
			}

			result.queries = queries;
			result.values = values;
			return result;
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

		clsCache = cOptions.cls;

		// create a constructor proxy
		var classConstructor = function( options ){

			options 			= options || {};
			options.$db 		= cOptions.db;
			options.$dbName 	= cOptions.database;
			options.$model 		= cOptions.model;

			return new cOptions.cls( options );
		}

		// apply static methods on the constructor proxy
		classConstructor.findOne 			= staticmodel.findOne.bind( staticmodel );
		classConstructor.find 				= staticmodel.find.bind( staticmodel );
		classConstructor.update 			= staticmodel.update.bind( staticmodel );
		classConstructor.remove 			= staticmodel.remove.bind( staticmodel );
		classConstructor.fetchAll			= staticmodel.fetchAll.bind( staticmodel );
		classConstructor.isDistributed		= staticmodel.isDistributed.bind( staticmodel );
		classConstructor.cacheInstruction	= staticmodel.cacheInstruction.bind( staticmodel );
		
		classConstructors[ cOptions.model ] = classConstructor;

		return classConstructor;
	}

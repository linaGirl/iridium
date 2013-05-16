


	var Class 			= iridium( "class" )
		, Events 		= iridium( "events" )
		, log 			= iridium( "log" )
		, Waiter 		= iridium( "util" ).Waiter; 


	var fs 				= require( "fs" );


	var StaticModel 	= require( "./staticmodel" )
		, MySQLPool 	= require( "./mysql" )
		, Model 		= require( "./model" )
		, LRUCache  	= require( "./lru" ); 



	module.exports = new Class( {
		inherits: MySQLPool


		, __models: {}



		, init: function( options ){
			// init db
			this.__proto__.__proto__.init.call( this, options.config );

			// set database name
			this.__databaseName = options.config.database;
			this.__schema 		= options.name;

			// get schame info
			this.__loadSchemas( function(){
				this.emit( "load" );
			}.bind( this ) );

			// listen  for cache messages for distributed models
			this.__dmodelsubject = "dmodel-" + this.__databaseName;
			process.on( "message", function( message ){
				if ( message.t === this.__dmodelsubject && this.__models[ message.m ] && this.__models[ message.m ].isDistributed() ) {
					this.__models[ message.m ].cacheInstruction( message.a, message.k, message.d );
				}
			}.bind( this ) );
		}



		, __loadSchemas: function( callback ){
			var   tableInfo = {}
				, relationInfo = null
				, waiter = new Waiter();


			// get relations
			this.query( "SELECT table_name, column_name, referenced_table_name, referenced_column_name FROM INFORMATION_SCHEMA.key_column_usage WHERE referenced_table_schema = ? AND referenced_table_name IS NOT NULL ORDER BY table_name, column_name;", [ this.__databaseName ], function( err, relations ){
				if ( err ) throw err;
				relationInfo = relations;
			}.bind( this ) );
			

			this.query( "SHOW TABLES in " + this.__databaseName + ";", function( err, tableNames ){
				if ( err ) throw err;

				// create table info query
				var query = tableNames.map( function( row ){
					return "SELECT '" + row[ "Tables_in_" + this.__databaseName ] + "' as tableName; DESCRIBE " + this.__databaseName + "." + row[ "Tables_in_" + this.__databaseName ] + ";"
				}.bind( this ) ).join( "" );


				this.query( query, function( err, tableData ){
					if ( err ) throw err;
					for ( var l = tableData.length, i = 0; i < l; i++ ){

						( function( modelName, tableData ){
							var properties = {};

							tableData.forEach( function( column ){
								properties[ column.Field ] = ( column.Key === "PRI" ? Model.PRIMARY : null )
							}.bind( this ) );

							this.__models[ modelName ] = new StaticModel( { 
								  db: 		this
								, model: 	modelName
								, database: this.__databaseName
								, cls: 		new Class( {
									inherits: 		Model
									, __properties: properties
								} )
							} );
							
							this.__defineSetter__( modelName, function(){ throw new Error( "you cannot overwrite the model [" + modelName + "] !" ); } );
							this.__defineGetter__( modelName, function(){ return this.__models[ modelName ]; }.bind( this ) );
						}.bind( this ) )( tableData[ i ][ 0 ].tableName, tableData[ i + 1 ] );

						//tableInfo[ tableData[ i ][ 0 ].tableName ] = tableData[ i + 1 ];
						i++;
					}
					callback();
				}.bind( this ) );
			}.bind( this ) );
		}
	} );
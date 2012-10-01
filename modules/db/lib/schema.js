


	var Class 			= iridium( "class" )
		, Events 		= iridium( "events" )
		, log 			= iridium( "log" ); 


	var fs 				= require( "fs" );


	var StaticModel 	= require( "./staticmodel" )
		, MySQLPool 	= require( "./mysql" ); 



	module.exports = new Class( {
		$id: "schema"
		, inherits: MySQLPool


		, __models: {}



		, init: function( options ){
			// init db
			this.__proto__.__proto__.init.call( this, options.config );

			// set database name
			this.__databaseName = options.config.database;
			this.__schema 		= options.name;

			// load schema files
			this.__loadFiles( options.config.path + "/" + options.name );
		}




		// load files from the disk
		, __loadFiles: function( dir ){
			fs.exists( dir, function( exists ){
				if ( exists ){
					// get all models
					fs.readdir( dir , function( err, files ){
						if ( err ) {
							throw new Error( "failed to load models dir " + dir + ": " + err );
						}

						var i = files.length, apiName, Model;
						while( i-- ){
							( function( filename ){

								// model name
								var modelName = filename.substr( 0, filename.length - 3 )
									, Model = require( dir + "/" + modelName );		

								// need to be class					
								if ( typeof Model !== "function" ) throw new Error( "the module [" + dir + "/" + modelName + "] doesnt export a class!", this );

								// create model
								this.__models[ modelName ] = new StaticModel( { 
									  db: 		this
									, model: 	modelName
									, database: this.__databaseName
									, cls: 		Model 
								} );

								this.__defineSetter__( modelName, function(){ throw new Error( "you cannot overwrite the model [" + modelName + "] !" ); } );
								this.__defineGetter__( modelName, function(){ return this.__models[ modelName ]; }.bind( this ) );
							}.bind( this ) )( files[ i ] );
						}

						this.emit( "load" );
					}.bind( this ) );
				}
				else {
					throw new Error( "schema dir [" + dir + "] does not exist!" );
				}
			}.bind( this ) );			
		}
	} );
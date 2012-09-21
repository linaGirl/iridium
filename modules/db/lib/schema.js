


	var Class 			= iridium( "class" )
		, Events 		= iridium( "events" )
		, log 			= iridium( "log" ); 


	var fs 				= require( "fs" );


	var StaticModel 	= require( "./staticmodel" )
		, MySQLPool 	= require( "./mysql" ); 



	module.exports = new Class( {
		$id: "schema"
		, inherits: MySQLPool



		, init: function( options ){ console.log( MySQLPool )
			// init db
			// "this" references to the child because this class was already inherited by a schema class.
			this.__proto__.__proto__.__proto__.init.call( this, options.config );

			// set database name
			this.__databaseName = options.config.database;

			// load schema files
			this.__loadFiles( this, "schema/" + this.__schema, { db: this.__db }, function(){
				this.emit( "ready" );
			}.bind( this ) );
		}




		// load files from the disk
		, __loadFiles: function( collection, dir, options, callback ){
			fs.exists( iridium.app.root + dir, function( exists ){
				if ( exists ){
					fs.readdir( iridium.app.root + dir , function( err, files ){
						if ( err ) {
							iridium.report( "error", "fs", err );
							throw new Error( "failed to load " + dir + " ..." );
						}

						var i = files.length, apiName, Model;
						while( i-- ){
							apiName = files[ i ].substr( 0, files[ i ].length - 3 );
							Model = require( iridium.app.root + dir + "/" + apiName );
							if ( typeof Model !== "function" ) throw new Error( "the module [" + iridium.app.root + dir + "/" + apiName + "] doesnt export a class!", this );
							collection[ apiName ] = new StaticModel( { db: this, model: apiName, database: this.__databaseName, cls: Model } );
							log.debug( "loading " + dir + " [" + apiName + "] ...", this );
						}

						callback();
					}.bind( this ) );
				}
			}.bind( this ) );			
		}
	} );
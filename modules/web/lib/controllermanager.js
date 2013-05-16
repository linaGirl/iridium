


	var Class 		= iridium( "class" )
		, Events 	= iridium( "events" )
		, log 		= iridium( "log" )
		, util 		= iridium( "util" )
		, Sequence	= util.Sequence
		, debug 	= util.argv.has( "trace-all" ) || util.argv.has( "trace-webservice" );


	var fs 			= require( "fs" );




	module.exports = new Class( {
		inherits: Events


		, __controllers: {}



		, init: function( options ){
			this.__path 			= options.path;
			this.__resources 		= options.resources;
			this.__files 			= options.files;
			this.__schemas 			= options.schemas;
			this.__sessions 		= options.sessions;
			
			this.__loadControllers( function(){
				this.emit( "load" );
			}.bind( this ) );
		}



		, has: function( name ){
			return this.__controllers.hasOwnProperty( name );
		}

		, get: function( name ){
			return this.__controllers[ name ] || null;
		}

		, setProperty: function( property, value ){
			var keys = Object.keys( this.__controllers ), i = keys.length;
			while( i-- ){
				this.__controllers[ keys [ i ] ][ property ] = value;
			}
		}


		, __loadControllers: function( callback ){
			fs.exists( this.__path, function( exists ){
				if ( exists ){
					fs.readdir( this.__path, function( err, files ){
						if ( err ) throw new Error( "failed to scan controller directory [" + this.__path + "]: " + err );
						
						var i = files.length, fileName;
						while( i-- ){
							if ( files[ i ].indexOf( ".js" ) > 0 ){
								( function( fileName ){
									// try {
										if ( debug ) log.info( "loading controller [" + fileName + "] ...", this );
										this.__controllers[ fileName ] = new ( require( ( this.__path + "/" + files[ i ] ).replace( "//", "/" ) ) )( {
											schemas: 		this.__schemas
											, files: 		this.__files
											, resources: 	this.__resources
											, sessions: 	this.__sessions
											, controllers: 	this
										} );

										this.__defineGetter__( fileName, function(){
											return this.__controllers[ fileName ];
										}.bind( this ) );
									// } catch ( e ){
										// throw new Error( "Failed to load controller [" + files[ i ] + "] in directory [" + this.__path + "]: " + err );
									// }
								}.bind( this ) )( files[ i ].substr( 0, files[ i ].lastIndexOf( "." ) ) );
							}
						}

						callback();
					}.bind( this ) );
				}
				else {
					throw new Error( "The controller directory [" + this.__path + "] doesnt exist!" );
				}
			}.bind( this ) );
		}
	} );
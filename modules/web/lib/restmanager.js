


	var Class 		= iridium( "class" )
		, Events 	= iridium( "events" )
		, log 		= iridium( "log" )
		, util 		= iridium( "util" )
		, Sequence	= util.Sequence
		, Waiter 	= util.Waiter
		, debug 	= util.argv.has( "trace-all" ) || util.argv.has( "trace-webservice" )
		, JSONRenderer = require( "./jsonrenderer" )
		, HTMLRenderer = require( "./htmlrenderer" );


	var fs 			= require( "fs" );




	module.exports = new Class( {
		inherits: Events


		, __controllers:{}
		, __renderers: {}
		, __defaultRenderer: null

		, init: function( options ){
			this.__path 			= options.path;
			this.__resources 		= options.resources;
			this.__files 			= options.files;
			this.__schemas 			= options.schemas;
			this.__sessions 		= options.sessions;
			
			this.__loadControllers( function(){
				this.emit( "load" );
			}.bind( this ) );

			this.addRenderer( "Application/JSON", new JSONRenderer(), true );
			this.addRenderer( "Text/HTML", new HTMLRenderer(), true );
		}


		, hasNamespace: function( namespace ){
			return this.__controllers.hasOwnProperty( namespace );
		}


		, has: function( namespace, name ){
			return this.__controllers.hasOwnProperty( namespace ) && this.__controllers[ namespace ].hasOwnProperty( name );
		}

		, get: function( namespace, name ){
			return this.has( namespace, name ) ? this.__controllers[ namespace ][ name ] : null;
		}

		, setProperty: function( property, value ){
			var keys = Object.keys( this.__controllers ), i = keys.length;
			while( i-- ){
				var nameKeys = Object.keys( this.__controllers[ keys[ i ] ] ), k = nameKeys.length;
				while( k-- ){
					this.__controllers[ keys[ i ] ][ nameKeys[ k ] ][ property ] = value;
				}
			}
		}



		, addRenderer: function( mime, renderer, isDefaultRenderer ){
			var parts = mime.toLowerCase().split( "/" );
			if ( parts.length !== 2 ) throw new Error( "invalid mimetype!" );

			if( !this.__renderers[ parts[ 0 ] ] ) this.__renderers[ parts[ 0 ] ] = {};
			this.__renderers[ parts[ 0 ] ][ parts[ 1 ] ] = renderer;


			if ( isDefaultRenderer ) this.__defaultRenderer = renderer;
		}


		, getRenderer: function( mimeList ){
			if ( !Array.isArray( mimeList ) ) return this.__defaultRenderer;
			else {
				for ( var i = 0, l = mimeList.length; i < l; i++ ){
					if ( this.__renderers[ mimeList[ i ].value.toLowerCase() ] && this.__renderers[ mimeList[ i ].value.toLowerCase() ][ mimeList[ i ].value2.toLowerCase() ] ) return this.__renderers[ mimeList[ i ].value.toLowerCase() ][ mimeList[ i ].value2.toLowerCase() ];
				}
			}
			return this.__defaultRenderer;
		}



		, __loadControllers: function( callback ){
			fs.exists( this.__path, function( exists ){
				if ( exists ){
					fs.readdir( this.__path, function( err, folders ){
						if ( err ) throw new Error( "failed to scan REST controller directory [" + this.__path + "]: " + err );
						
						var i = folders.length
							, waiter = new Waiter();

						while( i-- ){
							( function( folderName, folder ){
								waiter.add( function( cb ){
									fs.stat( folderName, function( err, stats ){
										if ( err ) throw new Error( "failed to stat REST controller directory [" + folderName + "]: " + err );

										if ( stats.isDirectory() ) this.__scanControllerDir( folderName, folder, cb );
										else cb();
									}.bind( this ) );
								}.bind( this ) );
							}.bind( this ) )( this.__path + "/" + folders[ i ], folders[ i ] );
						}

						waiter.start( callback );
					}.bind( this ) );
				}
				else {
					throw new Error( "The REST controller directory [" + this.__path + "] doesnt exist!" );
				}
			}.bind( this ) );
		}



		, __scanControllerDir: function( path, name, callback ){
			fs.readdir( path, function( err, files ){
				if ( err ) throw new Error( "faield to scan REST controller directory [" + path + "]: " + err );
				
				var i = files.length, fileName;

				while( i-- ){
					if ( files[ i ].indexOf( ".js" ) > 0 && files[ i ].indexOf( "-resource.js" ) === - 1 && files[ i ][ 0 ] !== "_" ){
						( function( fileName ){
							if ( debug ) log.info( "loading REST controller [" + fileName + "] ...", this );
							if ( !this.__controllers[ name ] ) this.__controllers[ name ] = {};
							this.__controllers[ name ][ fileName ] = new ( require( ( path + "/" + files[ i ] ).replace( "//", "/" ) ) )( {
								  schemas: 		this.__schemas
								, files: 		this.__files
								, resources: 	this.__resources
								, sessions: 	this.__sessions
								, controllers: 	this.__controllers
								, rest: 		this
								, name: 		fileName
								, namespace: 	name
								, path: 		path
							} );

							this.__defineGetter__( fileName, function(){
								return this.__controllers[ name ][ fileName ];
							}.bind( this ) );
						}.bind( this ) )( files[ i ].substr( 0, files[ i ].lastIndexOf( "." ) ) );
					}
				}

				callback();
			}.bind( this ) );
									
		}
	} );




	var Class = iridium( "class" )
		, Events = iridium( "events" )
		, log = iridium( "log" );


	var fs = require( "fs" );


	var File = require( "./file" );




	/*
	 * @class: 			MemoryFS
	 * @module: 		FS
	 * @description: 	loads an entire folder with all subfolders into the memory, gets updated on fs changes. 
	 * 				 	currently the memoryfs is readonly!
	 * @options: 		{
	 *						path: "" // string, pth of the directory which should be loaded into the memory
	 * 						, on: {} // object, event handlers	
	 *					}
	 */
	module.exports = new Class( {
		$id: "fs.MemoryFS"
		, inherits: Events


		, __path: null
		, __ready: false
		, __files: {}


		/* 
		 * @event: ready, fires if the path of the fs was successfull validated
		 * @event: Error,  
		 */
		, init: function( options ){
			this.__path = options.path;

			// load files as sson path is validated
			this.on( "ready", this.__load.bind( this ) );

			fs.exists( this.__path, function( exists ){
				if ( !exists ) {
					throw new Error( "Cannot load fs in to memory, path [" + this.__path + "] does not exist!" );
				}
				else {
					fs.stat( this.__path, function( err, stats ){
						if ( err ) throw err;
						if ( !stats.isDirectory() ) throw new Erorr( "MemoryFS root must be a directory!" );

						this.__path = this.__addSlash( this.__path );
						this.emit( "ready" );
					}.bind( this ) );
				}
			}.bind( this ) );
		}



		// start loading
		, __load: function(){
			log.debug( "loading dir [" + this.__path + "] ...", this );

			this.__loadDir( this.__path, function(){
				log.info( "Files are loaded ...", this );
				this.__ready = true;
			}.bind( this ) );
		}



		, __loadDir: function( path, callback, eventMode ){

			var startedOps = 1
				, finishedOps = 0
				, fileList = []
				, loaded = function( path, files ){
					if ( path ) fileList.push( path );
					if ( files ) fileList.concat( files );

					finishedOps++;
					if ( finishedOps === startedOps && callback ) callback( null, fileList );
				};


			// watch fodler for changes
			this.__addDirectoryWatch( path );


			// load dir
			fs.readdir( path, function( err, files ){
				if ( err ) throw new Error( "Failed to load dir [" + path + "]!" );

				startedOps += files.length;

				var i = files.length;
				while( i-- ){

					( function( file ){
						fs.stat( file, function( err, stats ){
							if ( err ) throw err;

							if ( stats.isDirectory() ){
								this.__loadDir( file + "/", loaded, eventMode );
							} 
							else if ( stats.isFile() ){
								this.__loadFile( file, loaded, eventMode );
							}
							else {
								throw new Error( "Failed to load path [" + file + "] because is neither a directory nor a file!" );
							}
						}.bind( this ) );
					}.bind( this ) )( path + files[ i ] );					
				}

				loaded();
			}.bind( this ) );
		}



		, __addDirectoryWatch: function( path ){
			// start watching the folder
			fs.watch( path, function( evt, filename ){
				var filePath = path + ( filename || "" );

				switch ( evt ){
					case "change":
						if ( filename ){
							this.__loadFile( filePath, null, "change" );
						}
						else {
							throw new Error( "fs.watch: the change event must always deliver a filename!" );
						}
						break;

					case "rename":
						fs.stat( filePath, function( err, stats ){
							if ( err ){
								// deleted
								var keys = Object.keys( this.__files ), i = keys.length;
								while( i-- ){
									if ( keys[ i ] === filePath || keys[ i ].indexOf( filePath + "/" ) === 0 ){
										if ( this.__files[ keys[ i ] ] ){
											this.__removeFile( keys[ i ] );
										}
										this.__emitChange( keys[ i ], "delete" );
									}
								}
							}
							else {
								// added
								if ( stats.isFile() ){
									this.__loadFile( filePath, null, "create" );

								}
								else {
									this.__loadDir( this.__addSlash( filePath ), null, "create" );
								}
							}
						}.bind( this ) );
						break;

					default:
						throw new Error( "unsupported fs.watch event [" + evt + "] for path [" + path + ( filename || "" ) + "]!" );
				}
			}.bind( this ) );
		}



		, __emitChange: function( path, eventMode ){
			if ( this.__ready ){
				this.emit( "change", eventMode, path );
				if ( this.__files[ path ] ){
					this.__files[ path ].emit( "change", eventMode );
				}
			}
		}




		, __removeFile: function( path ){
			if ( this.__files[ path ] ){
				this.__files[ path ].emit( "change", "delete" );
				this.__files[ path ].emit( "remove" );
			}
		}




		, __loadFile: function( path, callback, eventMode ){
			if ( this.__files[ path ] ){
				this.__files[ path ].reload( function(){
					this.__emitChange( path, eventMode );
				}.bind( this ) );
			}
			else {
				var load = function(){
					this.__emitChange( path, eventMode || "create" );
					if ( callback ) callback( path );
				}.bind( this )
				, replace = function( newFile ){
					if ( this.__files[ path ] ){
						this.__files[ path ].off( "replaced", replace );
						this.__files[ path ].off( "load", load );
					}
					newFile.on( "replaced", replace );
					newFile.on( "load", load );
					this.__files[ path ] = newFile;
				}.bind( this )
				, remove = function(){
					if ( this.__files[ path ] ){
						this.__files[ path ].off( "replaced", replace );
						this.__files[ path ].off( "load", load );
						this.__files[ path ].off( "remove", remove );
						delete this.__files[ path ];
					}
				}.bind( this );

				this.__files[ path ] = new File( {
					path: path
					, on: {
						load: load
						, replaced: replace
						, remove: remove
					}
				} );
			}
		}



		, __addSlash: function( path ){
			return path.substr( this.__path.length - 1 ) !== "/" ? path + "/" : path ;
		}
	} );
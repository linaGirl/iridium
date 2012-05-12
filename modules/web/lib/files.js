
	var Class = iridium( "class" )
		, Events = iridium( "events" )
		, util = iridium( "util" )
		, fs = require( "fs" )
		, path = require( "path" )
		, crypto = require( "crypto" )
		, log = iridium( "log" );






	var Files = module.exports = new Class( {
		$id: "web.Files"
		, inherits: Events

		// theweb root folder
		, __path: ""

		// files
		, __files: {}

		// depency graph
		, __graph: {}




		, init: function( options ){
			this.__path = path.resolve( options.path );

			// go
			fs.exists( this.__path, function( exists ){
				if ( exists ) {
					this.__load( this.__path );
					this.__watch();
				}
				else {
					throw new Error( "cannot load web files: the path [" + this.__path + "] does not exist!" );
				}
			}.bind( this ) );		
		}



		, exists: function( path ){
			return !!this.__files[ path ];
		}


		, get: function( path ){
			return this.__files[ path ] || null;
		}


		, getFileTreePointer: function(){
			return this.__files;
		}



		, __watch: function( path ){
			path = path || this.__path;

			fs.stat( path, function( err, stats ){
				if ( err ) throw err;

				if( stats.isDirectory() ){
					fs.watch( path, function( event, file ){
						this.__handleFileChange( event, path + "/" + file );
					}.bind( this ) );

					log.debug( "added watch for directory [" + path + "] ...", this );

					fs.readdir( path, function( err, filelist ){
						if ( err ) throw err;

						var i = filelist.length;
						while( i-- ) this.__watch( path + "/" + filelist[ i ] );
					}.bind( this ) );
				}
			}.bind( this ) );
		}

 
		, __loadFile: function( filePath, callback ){
			var webPath = filePath.substr( this.__path.length )
				, ext = webPath.substr( webPath.lastIndexOf( "." ) + 1 );

			fs.readFile( filePath, function( err, file ){
				if ( err ) throw err;

				if ( this.__files[ webPath ] ){
					this.__files[ webPath ].file = this.__files[ webPath ].binary ? file : file.toString( "utf-8" ) ;
					this.__files[ webPath ].length = file.length;
					this.__files[ webPath ].etag = crypto.createHash( "sha1" ).update( file ).digest( "hex" );
					this.__files[ webPath ].time = Date.now();
				}
				else {
					this.__files[ webPath ] = { 
						file: util.mime.isBinary( ext ) ? file : file.toString( "utf-8" )
						, length: file.length
						, extension: ext
						, binary: util.mime.isBinary( ext )
						, type: util.mime.get( ext )
						, path: filePath
						, time: Date.now()
						, etag: crypto.createHash( "sha1" ).update( file ).digest( "hex" )
					};

					this.emit( "change", {
						path: webPath
						, action: "set"
						, file: this.__files[ webPath ]
					} );

					// DIRECTORY INDEX
					if ( /index\.[a-z0-9_-]+$/gi.test( webPath ) ){
						var idxPath = webPath.substr( webPath.lastIndexOf( "/" )  );

						this.__files[ idxPath ] = this.__files[ webPath ];							
						this.emit( "change", {
							path: idxPath
							, action: "set"
							, file: this.__files[ idxPath ]
						} );
					}
				}

				callback();
			}.bind( this ) );
		}


		, __handleFileChange: function( event, path ){
			var webPath = path.substr( this.__path.length );

			switch ( event ){

				case "change":
					fs.stat( path, function( err, stats ){
						if ( err ) throw err;

						if ( stats.isDirectory() ){
							this.__load( path );
						}
						else if ( stats.isFile() ){
							this.__loadFile( path, function(){
								this.__compile( [ webPath ] );
							}.bind( this ) );
						}

					}.bind( this ) );
					break;

				case "rename": // aka delete, move, create
					fs.exists( path, function( exists ){
						if ( exists ){
							fs.stat( path, function( err, stats ){
								if ( err ) throw err;

								if ( stats.isDirectory() ){
									this.__load( path );
								}
								else if ( stats.isFile() ){
									this.__loadFile( path, function(){
										this.__compile( [ webPath ] );
									}.bind( this ) );
								}

							}.bind( this ) );
						}
						else {
							// its a file
							if ( this.__files[ webPath ] ){
								var idxPath = webPath.substr( webPath.lastIndexOf( "/") ) ;
								if ( this.__files[ idxPath ] === this.__files[ webPath ] ){
									this.emit( "change", {
										path: idxPath
										, action: "remove"
									} );
									// rm directoy index
									delete this.__files[ webPath.substr( webPath.lastIndexOf( "/") ) ];
								}
								this.emit( "change", {
									path: webPath
									, action: "remove"
								} );
								delete this.__files[ webPath ];
							}
							else {
								var keys = Object.keys( this.__files ), i = keys.length;

								while( i-- ){
									if ( keys[ i ].indexOf( webPath ) === 0 ){
										this.emit( "change", {
											path: keys[ i ]
											, action: "remove"
										} );
										delete this.__files[ keys[ i ] ];
									} keys[ i ] 
								}
							}

							this.__compile( [] );
						}
					}.bind( this ) );
					break;
				default: 
					log.warn( "uncaught fs.watch event [" + event + "] for file [" + file + "] ...");
			}
		}




		// analyze the depency tree, compile if needed
		, __compile: function( files ){
			if ( process.argv.indexOf( "--debug" ) >= 0 ){
				// dev mode, dont combine files, prepare for clientside module loader
				var i = files.length;
				while( i-- ){
					if ( this.__files[ files[ i ] ].extension === "mjs" ){
						// extend file so its suitable for the webloadr
						this.__files[ files[ i ] ].file = this.__prepareMJsFile( files[ i ], this.__files[ files[ i ] ].file );
						this.__files[ files[ i ] ].etag = crypto.createHash( "sha1" ).update( this.__files[ files[ i ] ].file ).digest( "hex" );
						this.__files[ files[ i ] ].time = Date.now();

						this.emit( "change", {
							path: files[ i ]
							, action: "set"
							, file: this.__files[ files[ i ] ]
						} );
					}
				}
			}
			else {
				// merge modules

				// locate iridium if not already known
				if ( ! this.__iridiumPath ){
					var i = files.length;
					while( i-- ){
						if ( files[ i ].indexOf( "iridium/index.js" ) >= 0 ){
							this.__iridiumPath = files[ i ].substr( 0, files[ i ].length - 9 );
							break;
						}
					}
				}

				// flatten paths, remove comments, get depencies, store them in the tree
				var i = files.length, fileInfo = {};
				while( i-- ){
					if ( this.__files[ files[ i ] ].extension === "mjs" ){
						fileInfo[ files[ i ] ] = this.__flattenMJsFile( files[ i ], this.__files[ files[ i ] ].file );
					}
				}

				// update depency graph
				this.__updateDepencyGraph( fileInfo );

				// compile changed files
				this.__compileMJS();
			}
			
			this.emit( "load" );
		}





		, __compileMJS: function(){
			var graph = this.__graph
				, keys = Object.keys( graph )
				, i = keys.length;

			while( i-- ){
				if ( graph[ keys[ i ] ].entrypoint === true ){
					this.__mergeTree( keys[ i ], [] );
				}
			}

			// log.info( "mjs compiler finished ...", this );
		}






		, __mergeTree: function( fileKey, loadedModules ){
			var tree = this.__collectTree( fileKey )
				, i = tree.length
				, file = ""
				, packedFiles = []
				, deferred = []
				, deferredKeys
				, loadedModulesCopy = []
				, d, k;

			
			log.info( "compiling " + ( loadedModules ? "entrypoint ": "" ) + "module [" + fileKey + "] ...", this );

			while( i-- ){
				if ( packedFiles.indexOf( tree[ i ] ) === -1 && loadedModules.indexOf( tree[ i ] ) === -1){
					packedFiles.push( tree[ i ] );
					loadedModules.push( tree[ i ] );
					log.debug( "adding module [" + tree[ i ] + "] ....", this );

					// concat file
					file += "\n// start module " + tree[ i ] + "\n\n" + this.__graph[ tree[ i ] ].file;

					// colelct deferring modules
					deferredKeys = Object.keys( this.__graph[ tree[ i ] ].deferred ), d = deferredKeys.length;
					while( d-- ){
						if ( deferred.indexOf( deferredKeys[ d ] ) === -1 ) deferred.push( deferredKeys[ d ] );
					}
				}
			}

			// compile deferring modules
			k = deferred.length;
			while( k-- ){
				this.__mergeTree( deferred[ i ], [].concat( loadedModules ) );
			}
			
			// store
			//this.__graph[ fileKey ].file = file;
			this.__graph[ fileKey ].deferringModules = deferred;
			this.__graph[ fileKey ].includedModules = packedFiles;
			
			this.__files[ fileKey ].file = file;
			this.__files[ fileKey ].etag = crypto.createHash( "sha1" ).update( this.__files[ fileKey ].file ).digest( "hex" );
			this.__files[ fileKey ].time = Date.now();

			this.emit( "change", {
				path: fileKey
				, action: "set"
				, file: this.__files[ fileKey ]
			} );
		}






		, __collectTree: function( file ){
			var graph = this.__graph
				, keys = Object.keys( graph[ file ].dependsOn ), i = keys.length
				, current, currentResult
				, tree = [];

			while( i-- ){
				current = graph[ keys[ i ] ];
				tree.push( keys[ i ] );

				if ( Object.keys( current.dependsOn ).length > 0 ){
					tree = tree.concat( this.__collectTree( keys[ i ] ) );
				}
			}
 
			return tree;
		}





		, __updateDepencyGraph: function( files ){
			
			// add to depencygraph
			var keys = Object.keys( files ), i = keys.length, current;
			while( i-- ){
				current = files[ keys[ i ] ];

				if ( ! this.__graph[ keys[ i ] ] ) {
					this.__graph[ keys[ i ] ]  = { 
						  dependsOn: {}
						, depencyOf: {}
						, deferredDepencyOf: {}
						, entrypoint: false 
					};	
				}

				this.__graph[ keys[ i ] ].file = current.file;
				this.__graph[ keys[ i ] ].entrypoint = current.entrypoint;
				this.__graph[ keys[ i ] ].updated = true;


				var depencies = files[ keys[ i ] ].depencies, d = depencies.length;

				while( d-- ){
					var currentDepency = depencies[ d ];

					if ( ! this.__graph[ currentDepency.module ] ) {
						this.__graph[ currentDepency.module ]  = { 
							  dependsOn: {}
							, deferred: {}
							, depencyOf: {}
							, deferredDepencyOf: {}
							, entrypoint: false 
						};	
					}

					this.__graph[ currentDepency.module ].updated = true;
					//if ( currentDepency.type === "normal" ) this.__graph[ depencies[ d ] ].depencyOf[ keys[ i ] ] = {};
					//if ( currentDepency.type === "deferred" ) this.__graph[ depencies[ d ] ].deferredDepencyOf[ keys[ i ] ] = {};
					if ( currentDepency.type === "normal" ) this.__graph[ keys[ i ] ].dependsOn[ currentDepency.module ] = {};
					if ( currentDepency.type === "deferred" ) this.__graph[ keys[ i ] ].deferred[ currentDepency.module ] = {};
				}
			}
		}







		// make all paths absolute, convert iridium calls to require calls, collect all paths, return file && modules
		, __flattenMJsFile: function( filePath_, file ){

			file = file.toString();

			// check if the module is an root entrypoint
			var isEntrypoint = /\/\/\s*iridium-entrypoint\s*=\s*true/gi.test( file );

			// remove comments
			file = file.replace( /\/\*[\s\S]*?\*\//gi, "" ).replace( / \/\/.*$/gim, "" );

			var   modulesReg = /require\s*\(\s*"(.+)"\s*\)/gi
				, defferedModuleReg = /require\s*\(\s*"(.+)"\s*[^\)\s]+/gi
				, iridiumModulesReg = /iridium\.module\s*\(\s*"(.+)"\s*\)/gi
				, iridiumCoreReg = /iridium\s*\(\s*"(.+)"\s*\)/gi
				, regResult
				, replacements = {}
				, modules = []
				, current = ""
				, keys, i;

			filePath_ = filePath_.substr( 0, filePath_.length - 4 );


			// extract paths for deffered modules, they will be made absolute to the webroot
			while( regResult = defferedModuleReg.exec( file ) ){
				replacements[ regResult[ 1 ] ] = path.join( filePath_, regResult[ 1 ] );
				module.push( { type: "deffered", module: replacements[ regResult[ 1 ] ] } );
			}

			// extract the regular modules
			while( regResult = modulesReg.exec( file ) ){
				replacements[ regResult[ 1 ] ] = path.join( filePath_, regResult[ 1 ] ); 				
				modules.push( { type: "normal", module: replacements[ regResult[ 1 ] ] } );
			}

			// replace relative paths with absolute paths
			keys = Object.keys( replacements );
			i = keys.length;

			while( i-- ){
				file = file.replace( new RegExp( "require\\s*\\(\\s*\"" + keys[ i ] + "\"\\s*\\)", "gi" ), "require( \"" + replacements[ keys[ i ] ] + "\" )" );
			}

			// extract iridium modules
			while( regResult = iridiumModulesReg.exec( file ) ) {
				current = path.join( this.__iridiumPath, "modules", regResult[ 1 ], "index.mjs" );
				modules.push( { type: "normal", module: current } );
				file = file.replace( new RegExp( "iridium\\.module\\s*\\(\\s*\"" + regResult[ 1 ] + "\"\\s*\\)", "gi" ), "require( \"" + current + "\" )" );
			}

			// extract iridium core modules
			while( regResult = iridiumCoreReg.exec( file ) ){
				current = path.join( this.__iridiumPath, "core", regResult[ 1 ] + ".mjs" );
				modules.push( { type: "normal", module: current } );
				file = file.replace( new RegExp( "iridium\\s*\\(\\s*\"" + regResult[ 1 ] + "\"\\s*\\)", "gi" ), "require( \"" + current + "\" )" );
			}

			file = "( function(){ module = { exports: {} };\n" + file;
			file += "\nwindow.__modules[ \"" + filePath_ + "\" ] = { module: module.exports, status: \"loaded\" }; } )();";

			return { depencies: modules, file: file, entrypoint: isEntrypoint };
		}






		// make paths absolut, add prefixes for iridium modules, add pre & suffix for clientside depency loading
		, __prepareMJsFile: function( filePath_, file ){

			file = file.toString();

			log.debug( "preparing mjs module [" + filePath_ + "]...", this );

			var iridium_prefix = '"use strict"; __require( "@moduleName", @depencies, function(){ var module = { exports: {} };\n';
			var iridium_suffix = '\nwindow.__iridiumLoader.moduleLoaded( "@moduleName", "@moduleAlias" ); return module; } );'

			var   aliasReg = /iridium-alias=(\S+)/gi.exec( file )
				, modulesReg = /require\s*\(\s*"(.+)"\s*\)/gi
				, defferedModuleReg = /require\s*\(\s*"(.+)"\s*[^\)\s]+/gi
				, iridiumModulesReg = /iridium\.module\s*\(\s*"(.+)"\s*\)/gi
				, iridiumCoreReg = /iridium\s*\(\s*"(.+)"\s*\)/gi
				, regResult
				, replacements = {}
				, modules = [] 
				, keys, i;

			filePath_ = filePath_.substr( 0, filePath_.length - 4 );

			while( regResult = defferedModuleReg.exec( file ) ){
				replacements[ regResult[ 1 ] ] = path.join( filePath_, regResult[ 1 ] );
			}

			while( regResult = modulesReg.exec( file ) ){
				replacements[ regResult[ 1 ] ] = path.join( filePath_, regResult[ 1 ] ); 				
				modules.push( replacements[ regResult[ 1 ] ] );
			}

			keys = Object.keys( replacements );
			i = keys.length;

			while( i-- ){
				file = file.replace( new RegExp( "require\\s*\\(\\s*\"" + keys[ i ] + "\"\\s*\\)", "gi" ), "require( \"" + replacements[ keys[ i ] ] + "\" )" );
			}


			while( regResult = iridiumModulesReg.exec( file ) ) {
				modules.push( "iridium-module://" + regResult[ 1 ] );
			}

			while( regResult = iridiumCoreReg.exec( file ) ){
				modules.push( "iridium://" + regResult[ 1 ] );
			}

			return iridium_prefix.replace( /@moduleName/gi, filePath_ ).replace( /@depencies/gi, JSON.stringify( modules ) ) + file + iridium_suffix.replace( /@moduleName/gi, "/" + path ).replace( /@moduleAlias/gi, aliasReg ? aliasReg[ 1 ] : "" );
		}






		// load files recursively
		, __load: function( path, loadedFiles, callback ){
			var loadedFiles = loadedFiles || []; // the files which were loaded ( and changed -> may require recompile )
			var loading = 1;

			callback = callback || function(){
				this.__compile( loadedFiles );
			}.bind( this ); 			

			loading++;
			fs.stat( path, function( err, stats ){
				if ( stats.isDirectory() ){
					loading++;
					fs.readdir( path, function( err, files ){
						if ( err ) throw err;
						var i = files.length;
						while( i-- ){
							loading++;
							this.__load( path + "/" + files[ i ], loadedFiles, function(){ 
								loading--; 
								if ( loading === 0 ) callback();
							} ); 
						}
						loading--;						
						if ( loading === 0 ) callback();
					}.bind( this ) );
				}
				else if ( stats.isFile() ){
					loading++;
					this.__loadFile( path, function(){
						loadedFiles.push( path.substr( this.__path.length ) );

						loading--; 
						if ( loading === 0 ) callback();
					}.bind( this ) );
				}
				loading--;
				if ( loading === 0 ) callback();
			}.bind( this ) );

			loading--; 
			if ( loading === 0 ) callback();
		}
	} );
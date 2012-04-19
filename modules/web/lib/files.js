
	var Class = iridium( "class" )
		, Events = iridium( "events" )
		, util = iridium.module( "util" )
		, fs = require( "fs" )
		, path = require( "path" );



	var Files = module.exports = new Class( {
		Extends: Events

		// theweb root folder
		, __path: ""

		// index files
		, __indexFiles: []

		// depency graph
		, __graph


		, constructor: function( options ){
			this.__path = path.resolve( options.path );

			// go
			path.exists( this.__path, function( exists ){
				if ( exists ) {
					this.__load( this.__path );
					this.__watch();
				}
				else {
					throw new Error( "cannot load web files: the path [" + this.__path + "] does not exist!" );
				}
			}.bind( this ) );		
		}




		, get: function( file ){

		}


		, __watch: function(){

		}



		// analyze the depency tree, compile if needed
		, __compile: function( files ){
			if ( process.argv.indexOf( "--debug" ) >= 0 ){
				// dev mode, dont combine files, dont uglify, prepare for clientside module loader
				var i = files.length;
				while( i-- ){
					if ( this.__files[ files[ i ] ].extension === "mjs" ){
						// extend file so its suitable for the webloadr
						this.__files[ files[ i ] ].file = this.__prepareMJsFile( files[ i ], this.__files[ files[ i ] ].file );
					}
				}

			}
			else {
				// merge modules, uglify

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

						var result = this.__flattenMJsFile( files[ i ], this.__files[ files[ i ] ].file );
						fileInfo[ files[ i ] ] = replacements;
					}
				}

				// update depency graph
				this.__updateDepencyGraph( fileInfo );

				// compile changed files
				this.__compileMJS();
			}
		}





		, __compileMJS: function(){

			// first pass: compile files that are entrypoints
			var graph = this.__graph;
				, keys = Object.keys( graph ), i = keys.length;

			while( i-- ){
				if ( graph[ keys[ i ] ].entrypoint === true ){
					this.__mergeTree( keys[ i ], [] );
				}
			}


			// second pass: compile files that depend on other files


		}



		, __mergeTree: function( fileKey, loadedModules ){
			var tree = this.__collectTree( fileKey )
				, i = tree.length
				, file
				, packedFiles = []
				, deferred = []
				, deferredKeys
				, loadedModulesCopy = []
				, d, k;

			

			while( i-- ){
				if ( packedFiles.indexOf( tree[ i ] ) === -1 && loadedModules.indexOf( tree[ i ] ) === -1){
					packedFiles.push( tree[ i ] );
					file += "\n" + this.__graph[ tree[ i ] ].file;

					deferredKeys = Object.keys( this.__graph[ tree[ i ] ].deferred ), d = deferredKeys.length;
					while( d-- ){
						if ( deferred.indexOf( deferredKeys[ d ] ) === -1 ) deferred.push( deferredKeys[ d ] );
					}
				}
			}




			k = deferred.length;
			while( k-- ){
				this.__mergeTree( deferred[ i ], [].concat( loadedModules ) );
			}

			
			this.__graph[ fileKey ].compiled = file;
			this.__graph[ fileKey ].deferringModules = deferred;
			this.__graph[ fileKey ].includedModules = packedFiles;
		}


		, __collectTree: function( file ){
			var graph = this.__graph
				, keys = Object.keys( graph[ files ].dependsOn ), i = keys.length
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


				var depencies = Object.keys( files[ keys[ i ] ].depencies ), d = depencies.length;
				while( d-- ){
					var currentDepency = files[ keys[ i ] ].depencies[ depencies[ d ] ];
					if ( ! this.__graph[ depencies[ d ] ] ) {
						this.__graph[ keys[ i ] ]  = { 
							  dependsOn: {}
							, deferred: {}
							, depencyOf: {}
							, deferredDepencyOf: {}
							, entrypoint: false 
						};	
					}

					this.__graph[ depencies[ d ] ].updated = true;
					if ( currentDepency.type === "normal" ) this.__graph[ depencies[ d ] ].depencyOf[ keys[ i ] ] = {};
					if ( currentDepency.type === "deferred" ) this.__graph[ depencies[ d ] ].deferredDepencyOf[ keys[ i ] ] = {};
					if ( currentDepency.type === "normal" ) this.__graph[ keys[ i ] ].dependsOn[ depencies[ d ] ] = {};
					if ( currentDepency.type === "deferred" ) this.__graph[ keys[ i ] ].deferred[ depencies[ d ] ] = {};
				}
			}
		}







		// make all paths absolute, convert iridium calls to require calls, collect all paths, return file && modules
		, __flattenMJsFile: function( path, file ){

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

			path = path.substr( 0, path.length - 4 );


			// extract paths for deffered modules, they will be made absolute to the webroot
			while( regResult = defferedModuleReg.exec( file ) ){
				replacements[ regResult[ 1 ] ] = path.join( path, regResult[ 1 ] );
				module.push( { type: "deffered", module: replacements[ regResult[ 1 ] ] } );
			}

			// extract the regular modules
			while( regResult = modulesReg.exec( file ) ){
				replacements[ regResult[ 1 ] ] = path.join( path, regResult[ 1 ] ); 				
				modules.push( { type: "normal", module: replacements[ regResult[ 1 ] ] } );
			}

			// replace relative paths with absolute paths
			keys = Object.keys( replacements );
			i = rkeys.length;

			while( i-- ){
				file = file.replace( new RegExp( "require\\s*\\(\\s*\"" + keys[ri ] + "\"\\s*\\)", "gi" ), "require( \"" + replacements[ keys[ i ] ] + "\" )" );
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
			file += "\nwindow.__modules[ \"" + path + "\" ] = { module: module.exports, status: \"loaded\" }; } )();";

			return { depencies: modules, file: file, entrypoint: isEntrypoint };
		}




		// make paths absolut, add prefixes for iridium modules, add pre & suffix for clientside depency loading
		, __prepareMJsFile: function( path, file ){

			file = file.toString();

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

			path = path.substr( 0, path.length - 4 );

			while( regResult = defferedModuleReg.exec( file ) ){
				replacements[ regResult[ 1 ] ] = path.join( path, regResult[ 1 ] );
			}

			while( regResult = modulesReg.exec( file ) ){
				replacements[ regResult[ 1 ] ] = path.join( path, regResult[ 1 ] ); 				
				modules.push( replacements[ regResult[ 1 ] ] );
			}

			keys = Object.keys( replacements );
			i = rkeys.length;

			while( i-- ){
				file = file.replace( new RegExp( "require\\s*\\(\\s*\"" + keys[ri ] + "\"\\s*\\)", "gi" ), "require( \"" + replacements[ keys[ i ] ] + "\" )" );
			}


			while( regResult = iridiumModulesReg.exec( file ) ) {
				modules.push( "iridium-module://" + regResult[ 1 ] );
			}

			while( regResult = iridiumCoreReg.exec( file ) ){
				modules.push( "iridium://" + regResult[ 1 ] );
			}

			return iridium_prefix.replace( /@moduleName/gi, path ).replace( /@depencies/gi, JSON.stringify( modules ) ) + file + iridium_suffix.replace( /@moduleName/gi, "/" + path ).replace( /@moduleAlias/gi, aliasReg ? aliasReg[ 1 ] : "" );
		}






		// load files recursively
		, __load: function( path, loadedFiles ){
			var loadedFiles = loadedFiles || []; // the files which were loaded ( and changed -> may require recompile )
			var loadingCount = 0;


			fs.stat( path, function( stats ){
				if ( stats.isDirectory() ){
					fs.readDir( path, function( err, files ){
						if ( err ) throw err;
						var i = files.length;
						while( i-- ){ this.__load( path + "/" + files[ i ], loadedFiles ); }
					}.bind( this ) );
				}
				else if ( stats.isFile() ){
					loadingCount++;
					fs.readFile( path, function( err, file ){
						if ( err ) throw err;

						// store
						var ext = path.substr( path.lastIndexOf( "." ) + 1 )
							, webPath = path.substr( this.__path.length );
						this.__files[ webPath ] = { file: file, extension: ext, type: util.mime.get( ext ), path: path };
						loadedFiles.push( webPath );

						// all files are laoded ?
						loadingCount--;
						if ( loadingCount === 0 ){
							this.__compile( loadedFiles );
						}
					}.bind( this ) );
				}
			}.bind( this ) );
		}
	} );
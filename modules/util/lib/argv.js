

	var Class = iridium( "class" );

	global.__iridium_argv = module.exports = global.__iridium_argv || new ( new Class( {
		$id: "argv"

		, __argv: {}


		, init: function(){
			var argv = Array.prototype.slice.call( process.argv, 2 ).join( " " ).split( "--" ).filter( function( item ){ 
				return item.length > 0; 
			} ).forEach( function( item ){
				var reg = /([^ =]+)(?: |=)(.+)/gi.exec( item.trim() );

				if ( reg ){
					this.__argv[ reg[ 1 ].trim() ] = reg[ 2 ];
				}
				else {
					this.__argv[ item.trim() ] = null;
				}
			}.bind( this ) );

			var stat = require( "fs" ).statSync( process.argv[ 1 ] );
			if ( stat.isDirectory() ){
				this.__callingPath = process.argv[ 1 ] + "/";
			}
			else {
				this.__callingPath = process.argv[ 1 ].substr( 0, process.argv[ 1 ].lastIndexOf( "/" ) + 1 );
			}
			
		}


		, has: function( key ){
			return this.__argv.hasOwnProperty( key );
		}


		, get: function( key ){
			return this.__argv[ key ];
		}


		, getCallingPath: function(){
			return this.__callingPath;
		}
	} ) )();
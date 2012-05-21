

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
					this.__argv[ reg[ 1 ] ] = reg[ 2 ];
				}
				else {
					this.__argv[ item ] = null;
				}
			}.bind( this ) );
		}


		, has: function( key ){
			return this.__argv.hasOwnProperty( key );
		}


		, get: function( key ){
			return this.__argv[ key ];
		}
	} ) )();
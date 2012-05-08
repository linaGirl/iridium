

	var Class = iridium( "class" );

	module.exports = new Class( {
		$id: "argv"

		, __argv: {}


		, init: function(){
			var argv = Array.prototype.slice.call( process.argv, 2 ).join( " " ).split( "--" ).filter( function( item ){ 
				return item.length > 0; 
			} ).forEach( function( item ){
				var idx, current;

				item = item.trim();

				if ( ( idx = item.indexOf( " " ) ) >= 0 ){
					current = item.substr( idx + 1 );
					this.__argv[ item.substr( 0, idx ) ] = /[^0-9]/.test( current ) ? /^(?:true|false)$/i.test( current ) ? !!current :current : parseFloat( current );
				}
				else {
					this.__argv[ item ] = null;
				}
			}.bind( this ) );
		}


		, has: function( key ){
			return this.__argv.hasOwnPorperty( key );
		}


		, get: function( key ){
			this.__argv[ key ];
		}
	} );
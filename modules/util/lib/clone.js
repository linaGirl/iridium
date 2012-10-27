	


	var clone = module.exports = function( input ){
		var result, i, keys;

		switch ( typeof input ){
			case "object":
				if ( Array.isArray( input ) ){
					result = input.length > 0 ? input.slice( 0 ) : [];
					i = result.length;
					while( i-- ) result[ i ] = clone( result[ i ] );
				}
				else if ( Buffer.isBuffer( input ) ){
					result = new Buffer( input.length );
					input.copy( result );
				}
				else if ( input === null ){
					return null;
				}
				else if ( input instanceof RegExp ){
					return input;
				}
				else {
					result = {};
					keys = Object.keys( input );
					i = keys.length;
					while( i-- ) result[ keys[ i ] ] = clone( input[ keys[ i ] ] );
				}
				break;

			default:
				return input;
		}

		return result;
	}
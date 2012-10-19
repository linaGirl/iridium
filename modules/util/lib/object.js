
	


	module.exports = {
		each: function( obj, fn ){
			if ( typeof obj === "object" && obj !== null ){
				var keys = Object.keys( obj ), i = l = keys.length;
				while( i-- ) fn( obj[ keys[ l - i - 1 ] ] );
			}
		}

		, map: function( obj, fn ){
			if ( typeof obj === "object" && obj !== null ){
				var keys = Object.keys( obj ), i = l = keys.length, result = {};
				while( i-- ) result[ keys[ i ] ] = fn( obj[ keys[ l - 1 - i ] ] );
				return result;
			}
			return obj;
		}
	};
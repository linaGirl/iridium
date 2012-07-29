	var clone = function( input ){
		if ( input === null ) return null;
		
		var result = Object.prototype.toString.apply( input ) === "[object Array]" ? [] : {}
			, keys = Object.keys( input )
			, i = keys.length
			, current;

		while( i-- ){
			current = input[ keys[ i ] ];
			if ( typeof current === "object" ){
				//console.log( current, Object.prototype.toString.apply( current ) )
				if ( current === null ){
					result[ keys[ i ] ] = null;
				}
				else if ( Object.prototype.toString.apply( current ) === "[object Array]" ){
					result[ keys[ i ] ] = current.slice();
				}
				else {
					result[ keys[ i ] ] = clone( current );
				}
			}
			else {
				result[ keys[ i ] ] = current;
			}
		}

		return result;
	}



	var createProperty = function( input ){
		return {
			value: input
			, writable: true
			, configurable: true
			, enumerable: true
		};
	}


	var createProperties = function( input ){
		var keys = Object.keys( input ), i = keys.length, result = {};
		while( i-- ){
			if ( keys[ i ] !== "inherits" ){
				result[ keys[ i ] ] = createProperty( input[ keys[ i ] ] );
			}
		}

		return result;
	}



	module.exports = function( definition ){
		var baseclass = definition.inherits ? ( definition.inherits.___iridium_baseclass ? definition.inherits.___iridium_baseclass : definition.inherits ) : {}
			, properties = createProperties( definition )
			, ref = Object.create( clone ( baseclass ), clone( properties ) );
			
		var constructor = function( options ){
			var parent = clone ( baseclass )
				, instance = Object.create( parent, clone( properties ) )
				, stacktrace = new Error().stack
				, modulename = ( /.*\n.*\n.*\/(.+\:[0-9]+)\:/i.exec( stacktrace ) || [ "", "" ] )[ 1 ];

			if ( /index.js/.test( modulename ) || /class.js/.test( modulename ) ) modulename = ( /.*\n.*\n.*\n.*\/(.+\:[0-9]+)\:/i.exec( stacktrace ) || [ "", "" ] )[ 1 ] || modulename;
			instance.$id = ( instance.$id || "-" ) + " <" + modulename + ">" ;

			instance.parent = parent;
			if ( options && options.on && instance.$events ) instance.on( options.on );

			if ( typeof instance.init === "function" ) {
				var result = instance.init( options || {} );
				if ( typeof result === "object" ){
					instance = result;
				}
			}

			
			return instance;
		} ;

		Object.defineProperty( constructor, "___iridium_baseclass", { value: ref, writable: false, configurable: false, enumerable: false } );

		return constructor
	}
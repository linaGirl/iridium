
	var clone = function( input ){
		var result = Object.create( input )
			, keys = Object.keys( result )
			, i = keys.length;

		while( i-- ){
			if ( typeof result[ keys[ i ] ] === "object" ){
				result[ keys[ i ] ] = clone( result[ keys[ i ] ] );
			}
		}

		return result;
	}


	module.exports = function( classDefinition ){
		classDefinition = classDefinition || {} ;

		var classProperties = {}
			, doesInherit = classDefinition.inherits && classDefinition.inherits.$baseClass
			, baseClass = doesInherit ? Object.create( classDefinition.inherits.$baseClass, classDefinition.inherits.$classProperties ) : {} ;


		var keys = Object.keys( baseClass )
			, i = keys.length
			, current;



		// append object properties from inherited class
		if ( doesInherit ){
			while( i-- ){
				current = baseClass[ keys[ i ] ];

				if ( typeof current === "object" ){
					classProperties[ keys[ i ] ] = { value: clone( current ), writable: true, configurable: true, enumerable: true };
				}
				else if ( typeof current !== "function" ){
					classProperties[ keys[ i ] ] = { value: current, writable: true, configurable: true, enumerable: true };
				}
			}
		}


		// separate methods from data, clone objects
		keys = Object.keys( classDefinition ), i = keys.length;
		while( i-- ){
			current = classDefinition[ keys[ i ] ];

			if ( typeof current === "function" ){
				baseClass[ keys[ i ] ] = current;
			}
			else if ( typeof current === "object" ){
				classProperties[ keys[ i ] ] = { value: clone( current ), writable: true, configurable: true, enumerable: true };
			}
			else {
				classProperties[ keys[ i ] ] = { value: current, writable: true, configurable: true, enumerable: true };
			}
		}



		// return the class contructor
		var Class = function( options ){
			var classInstance = Object.create( baseClass, classProperties );

			// debugging stuff, a bit stupid
			var modulename = ( /.*\n.*\n.*\/(.+\:[0-9]+)\:/i.exec( new Error().stack ) || [ "", "" ] )[ 1 ];
			if ( /index.js/.test( modulename ) ) modulename = ( /.*\n.*\n.*\n.*\/(.+\:[0-9]+)\:/i.exec( new Error().stack ) || [ "", "" ] )[ 1 ] || modulename;
			classInstance.$id = ( classInstance.$id || "-" ) + " <" + modulename + ">" ;

			// constructor
			if ( classInstance.init ){
				var result = classInstance.init( options || {} );
				if ( typeof result === "object" ){
					classInstance = result;
				}
			}

			// events
			if ( options && options.on && classInstance.$events ) classInstance.on( options.on );
			return classInstance;
		}

		// store references for inheritance
		Class.$baseClass = baseClass;
		Class.$classProperties = classProperties;

		return Class;
	}
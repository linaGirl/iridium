
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
					//console.log( keys[ i ], current);
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
			var okeys = Object.keys( classProperties ), i = okeys.length, newClassProperties = {};
			while( i-- ){
				if ( typeof classProperties[ okeys[ i ] ].value === "object" ){
					newClassProperties[ okeys[ i ] ] = { value: clone( classProperties[ okeys[ i ] ].value ), writable: true, configurable: true, enumerable: true };
				}
				else {
					newClassProperties[ okeys[ i ] ] = classProperties[ okeys[ i ] ];
				}
			}

			var classInstance = Object.create( baseClass, newClassProperties );

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
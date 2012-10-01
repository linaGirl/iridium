	
	"use strict";


	// clone whatever comes
	var clone = function( input ){
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
	

	// create an properties object
	var makeProperties = function( input ){
		var properties = {}
			, keys = Object.keys( input )
			, i = keys.length;
		while( i-- ) properties[ keys[ i ] ] = { value: input[ keys[ i ] ], writable: true, configurable: true, enumerable: true };
		return properties;
	}



	var getClassId = function(){
		var path = ( /\(([^\:]+)\:/gi.exec( new Error().stack.split( "\n" )[ 3 ] ) || [ null, "" ] )[ 1 ].replace( /\.m?js$/, "" );

		if ( global.iridium && path.indexOf( iridium.root ) === 0 ){
			return path.substr( iridium.root.length ).replace( /\//g, "." );
		}

		return "";
	}



	module.exports = function( classDefinition ){
		var   proto 			= {}
			, classProperties 	= {}
			, getters 			= {}
			, setters 			= {}
			, staticProperties 	= {}
			, parentClass, keys, i, id, get, set, setterKeys, getterKeys, staticKeys, o;


		// collect inherited data
		if ( classDefinition.inherits ){
			parentClass 		= classDefinition.inherits.$$__iridium__$$;
			proto 				= Object.create( parentClass.proto );
			classProperties 	= clone( parentClass.properties );
			setters 			= clone( parentClass.setters );
			getters				= clone( parentClass.getters );
			staticProperties 	= clone( parentClass.staticProperties );
		}
		

		// extract definition components
		keys = Object.keys( classDefinition );
		i = keys.length;

		while( i-- ){
			id  = keys[ i ];
			get = classDefinition.__lookupGetter__( id );
			set = classDefinition.__lookupSetter__( id );

			// separte getters & setters
			if ( get || set ){
				if ( get ) getters[ id ] = get;
				if ( set ) setters[ id ] = set;
			}
			// separate static properties
			else if ( id.indexOf( "static " ) === 0 ){
				staticProperties[ id.substr( 7 ) ] = classDefinition[ id ];
			}
			// the rest
			else if ( id !== "inherits" ){
				switch ( typeof classDefinition[ id ] ){
					case "function":
						proto[ id ] = classDefinition[ id ];
						break;

					default:
						classProperties[ id ] = classDefinition[ id ];
						break;
				}
			}
		}


		// get keys of the props
		setterKeys = Object.keys( setters );
		getterKeys = Object.keys( getters );

		
		// set class id
		classProperties.$id = getClassId();


		// this is the actual class contructor
		var ClassConstructor = function( options ){
			// instantiate the class with its prototype and porperties
			// wee need to clone the properties so the properties
			// typeof object wont be shared between the instances
			var instance = Object.create( proto, makeProperties( clone( classProperties ) ) )
				, k = setterKeys.length
				, m = getterKeys.length
				, contructorResult;

			// add setters and getters
			while( m-- ) instance.__defineGetter__( getterKeys[ m ], getters[ getterKeys[ m ] ] );
			while( k-- ) instance.__defineSetter__( setterKeys[ k ], setters[ setterKeys[ k ] ] );

			// add eventlisteners
			if ( options && options.on && instance.$events ) instance.on( options.on );

			// call the class contsructor
			if ( typeof instance.init === "function" ){
				contructorResult = instance.init( options || {} );
				if ( typeof contructorResult === "object" ) instance = contructorResult;
			}

			// thats it :)
			return instance;
		};


		// add static properties
		staticKeys = Object.keys( staticProperties );
		o = staticKeys.length;
		while( o-- ) ClassConstructor[ staticKeys[ o ] ] = staticProperties[ staticKeys[ o ] ];


		// store class components
		Object.defineProperty( ClassConstructor, "$$__iridium__$$", { value: {
			proto: 				proto
			, properties: 		classProperties
			, setters: 			setters
			, getters: 			getters
			, staticProperties: staticProperties	
		}, writable: false, configurable: false, enumerable: false } );

		return ClassConstructor;
	}
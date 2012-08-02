	
	"use strict";


	// deep instantiate an object ( create new object from existing ones, set original prototype, set properties );
	var instantiate = function( obj, proto ){
		var newObj = Array.isArray( obj ) ? obj.slice() : Object.create( proto ? proto : ( ( !Object.prototype.hasOwnProperty.call( obj, "__proto__" ) && obj.__proto__ ) ? obj.__proto__ : null ), getProperties( obj ) );
		var keys = Object.keys( newObj ), i = keys.length;
		while( i-- ) if ( typeof( newObj[ keys[ i ] ] ) === "object" && newObj[ keys[ i ] ] !== null ) newObj[ keys[ i ] ] = instantiate( newObj[ keys[ i ] ] );
		return newObj;
	}

	// create properties objects
	var getProperties = function( obj ){
		var keys = Object.keys( obj ), i = keys.length, newObj = {}; 
		while( i-- ) if ( keys[ i ] !== "inherits" ) newObj[ keys[ i ] ] = { value: obj[ keys[ i ] ], writable: true, configurable: true, enumerable: true };
		return newObj;
	}


	// some debugging stuff
	var getModuleName = function(){
		if ( process.argv.indexOf( "--nolog" ) !== -1 ) return "";
		var moduleList = new Error().stack.split( "\n" ).map( function( line ){
			var reg = /(.*)\/([^\/\:]+\/[^\/\:]+\:[0-9]+)\:[0-9]*\)\s*$/ig.exec( line );
			return reg && reg[ 1 ].indexOf( "iridium" ) === -1 ? reg[ 2 ] : null ;
		} ).filter( function( line ){
			return !!line;
		} );

		return moduleList.length > 0 ? moduleList[ 0 ] : "-";
	}



	module.exports = function( definition ){
		var properties = definition.inherits && definition.inherits.___iridium_sgetters ? definition.inherits.___iridium_sgetters : {}
			, keys = Object.keys( definition )
			, i = keys.length, get, set
			, statics = {}, staticKeys, k;

		// extract setters && getters
		while( i-- ){
			get = definition.__lookupGetter__( keys[ i ] );
			set = definition.__lookupSetter__( keys[ i ] );

			if ( get || set ){
				properties[ keys[ i ] ] = {};
				if ( get ) properties[ keys[ i ] ].get = get;
				if ( set ) properties[ keys[ i ] ].set = set;
				delete definition[ keys[ i ] ];		
			}
			else if ( keys[ i ].indexOf( "static " ) === 0 ){
				statics[ keys[ i ].substr( 7 ) ] = definition[ keys[ i ] ];
				delete definition[ keys[ i ] ];		
			}
		}


		

		var ClassContructor = function( instanceOptions ){
			var inherit = definition.inherits ? ( definition.inherits.___iridium_baseclass ? instantiate( definition.inherits.___iridium_baseclass ) : definition.inherits ) : null
				, classInstance = instantiate( definition, inherit );

			// id
			classInstance.$id = ( classInstance.$id || "-" ) + " <" + getModuleName() + ">" ;

			// events
			if ( instanceOptions && instanceOptions.on && classInstance.$events ) classInstance.on( instanceOptions.on );
			

			// properties
			if ( properties ){
				var keys = Object.keys( properties ), i = keys.length;
				while( i-- ){
					if ( properties[ keys[ i ] ].get ) classInstance.__defineGetter__( keys[ i ], properties[ keys[ i ] ].get );
					if ( properties[ keys[ i ] ].set ) classInstance.__defineSetter__( keys[ i ], properties[ keys[ i ] ].set );
				}
			}

			// init, contructor
			if ( typeof classInstance.init === "function" ) {
				var result = classInstance.init( instanceOptions || {} );
				if ( typeof result === "object" ){
					classInstance = result;
				}
			}

			return classInstance;
		}

		// apply static functions
		staticKeys = Object.keys( statics ), k = staticKeys.length;
		while( k-- ) ClassContructor[ staticKeys[ k ] ] = statics[ staticKeys[ k ] ];

		// reference used for inherit
		Object.defineProperty( ClassContructor, "___iridium_baseclass", { value: instantiate( definition, definition.inherits ? definition.inherits.___iridium_baseclass : null ), writable: false, configurable: false, enumerable: false } );
		Object.defineProperty( ClassContructor, "___iridium_sgetters", { value: properties, writable: false, configurable: false, enumerable: false } );
		return ClassContructor;
	};



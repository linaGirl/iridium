	
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



	var getModuleName = function(){
		var moduleList = new Error().stack.split( "\n" ).map( function( line ){
			var reg = /(.*)\/([^\/\:]+\/[^\/\:]+\:[0-9]+)\:[0-9]*\)\s*$/ig.exec( line );
			return reg && reg[ 1 ].indexOf( "iridium" ) === -1 ? reg[ 2 ] : null ;
		} ).filter( function( line ){
			return !!line;
		} );

		return moduleList.length > 0 ? moduleList[ 0 ] : "-";
	}


	module.exports = function( definition ){
		var cls = instantiate( definition, definition.inherits ? definition.inherits.___iridium_baseclass : null );
		

		var ClassContructor = function( instanceOptions ){
			var inherit = definition.inherits ? ( definition.inherits.___iridium_baseclass ? instantiate( definition.inherits.___iridium_baseclass ) : definition.inherits ) : null
				, classInstance = instantiate( definition, inherit );

			classInstance.$id = ( classInstance.$id || "-" ) + " <" + getModuleName() + ">" ;

			if ( instanceOptions && instanceOptions.on && classInstance.$events ) classInstance.on( instanceOptions.on );
			classInstance.parent = inherit;

			if ( typeof classInstance.init === "function" ) {
				var result = classInstance.init( instanceOptions || {} );
				if ( typeof result === "object" ){
					classInstance = result;
				}
			}

			return classInstance;
		}

		Object.defineProperty( ClassContructor, "___iridium_baseclass", { value: cls, writable: false, configurable: false, enumerable: false } );
		return ClassContructor;
	};




	// simpler classes by @eventEmitter;


	// clone objects for class instances, so they dont share their values
	var clone = function( item, firstLevel ){
		if ( typeof item === "object" ){
			if ( item === null ) return item;
			else if ( Buffer.isBuffer( item ) ) {
				return buf = new Buffer( item.length ), item.copy( buf ), firstLevel ? { enumerable: true, value: buf } : buf;
			}
			else {
				var no = item instanceof Array ? [] : {}, keys = Object.keys( item ), i = keys.length;
				while( i-- ){ no[ keys[ i ] ] = firstLevel ? { enumerable: true, value: clone( item[ keys [ i ] ] ) } : clone( item[ keys [ i ] ] ); };
				return no;
			}
		}
		else return item;
	}


	module.exports = Class = function( definition ){
		if ( definition ){
			var   properties = {} // direct class properties, scalar values, functions
				, hasOwnProperty = Object.prototype.hasOwnProperty
				, extend = hasOwnProperty.call( definition, "Extends" ) // does this class extend another?
				, parent = extend && hasOwnProperty.call( definition.Extends, "$prototype" ) ? definition.Extends.$prototype : {}
				, classProperties = extend && hasOwnProperty.call( parent, "$properties" ) ? parent.$properties : {} // properties typof object which must be cloned
				, keys = Object.keys( definition )
				, i = keys.length
				, current
				, Class = function( options ){
					// instantiate
					var instance = Object.create( Class.$prototype, clone( classProperties, true ) );
					
					// debugging stuff, will slow all down
					var modulename = ( /.*\n.*\n.*\/(.+\:[0-9]+)\:/i.exec( new Error().stack ) || [ "", "" ] )[ 1 ];
					if ( /index.js/.test( modulename ) ) modulename = ( /.*\n.*\n.*\n.*\/(.+\:[0-9]+)\:/i.exec( new Error().stack ) || [ "", "" ] )[ 1 ];
					instance.$id = ( instance.$id || "-" ) + "@" + modulename;

					if ( options && options.on && instance.$events ) instance.on( options.on ); // add events if availble
					if ( instance.constructor ) instance.constructor( options );
					return instance;
				};

			while( i-- ){
				current = definition[ keys[ i ] ];
				if ( keys[ i ] === "Extends" ){
					parent = hasOwnProperty.call( current, "$prototype" ) ? current.$prototype : current;
				}
				else {
					if ( typeof current === "object" ){
						classProperties[ keys[ i ] ] = current;
					}
					else {
						properties[ keys[ i ] ] = { value: current };
					}
				}
			}

			// store references used for ectending classes
			Class.$prototype = Object.create( parent, properties );
			Class.$prototype.$properties = classProperties;

			return Class;
		}
		else {
			return function(){};
		}
	}
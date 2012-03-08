	
	// simpler classes by @eventEmitter;

	module.exports = Class = function( definition ){
		if ( definition ){
			var properties = {}
				, Class = function( options ){
					var instance = Object.create( Class.$prototype );
					
					// debugging shit
					var modulename = ( /.*\n.*\n.*\/(.+\:[0-9]+)\:/i.exec( new Error().stack ) || [ "", "" ] )[ 1 ];
					if ( /index.js/.test( modulename ) ) modulename = ( /.*\n.*\n.*\n.*\/(.+\:[0-9]+)\:/i.exec( new Error().stack ) || [ "", "" ] )[ 1 ];
					instance.$id = ( instance.$id || "-" ) + "@" + modulename;

					if ( options && options.on && instance.$events ) instance.on( options.on ); // add events if availble
					if ( instance.constructor ) instance.constructor( options );
					return instance;
				}
				, keys = Object.keys( definition )
				, i = keys.length
				, parent = {}, current, type
				, hop = Object.prototype.hasOwnProperty;

			while( i-- ){
				current= definition[ keys[ i ] ];

				if ( keys[ i ] === "Extends" ){
					parent = ( hop.call( current, "$prototype" ) ) ? current.$prototype : current ;
				}
				else {
					type = typeof current;

					if ( type === "object" && hop.call( current, "$definition" ) ){
						properties[ keys[ i ] ] = current;
					}
					else {
						properties[ keys[ i ] ] = { value: current }
					}
				}
			}

			Class.$prototype = Object.create( parent, properties );

			return Class;
		}
		else {
			return function(){};
		}
	}
	
	// simpler classes by @eventEmitter;

	module.exports = Class = function( definition ){
		if ( definition ){
			var properties = {}
				, Class = function( options ){
					var instance = Object.create( Class.$prototype );
					// debugging shit
					instance.$id = module.parent.id.substr( module.id.lastIndexOf( "/" )  + 1 ) + ":" + ( instance.$id || "-" );
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
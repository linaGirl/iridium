	"use strict";

	var Class = require( "./class" );


	// cutom events, clientside does the same
	module.exports = new Class( {		
		$events: {}

		// emit events delayed
		, emit: function( event ){
			process.nextTick( function(){
				var args = Array.prototype.slice.call( arguments, 1 );

				if ( this.$events[ event ] ){
					this.$events[ event ].forEach( function( evt ){
						evt.listener.apply( null, args );
					} );
				}
			}.bind( this ) );
			return this;
		}

		// return all listener for a given event
		, listeners: function( event ){
			return ( this.$events[ event ] || [] ).map( function( evt ){ return evt.listener } );
		}

		// remove all listeners, all listeners of a specific event or a single listener
		, off: function( event, listener ){			
			if ( event ){
				if ( listener && this.$events[ event ] ) this.$events[ event ].filter( function( evt ){ return evt.listener !== listener } );
				else if ( this.$events[ event ] ) delete this.$events[ event ];
			} else this.$events = {};

			this.emit( "removeListener", event, listener );
			return this;
		}


		// add one ( two args ) or multiple events ( one arg -> object ). fired once.
		, once: function( event, listener ){			
			return this.on( event, listener, true );
		}


		// add one ( two args ) or multiple events ( one arg -> object ). fired once ( third arg )
		, on: function( event, listener, once ){
			var keys, i;
			if ( typeof event === "object" ){
				// multiple events
				keys = Object.keys( event );
				i = keys.length;
				while( i-- ) this.addListener( keys[ i ], event[ keys[ i ] ], once );
			} else this.addListener( event, listener, once );

			return this;
		}


		// adds a listenr, somehow private
		, addListener: function( event, listener, once ){
			if ( ! this.$events[ event ] ) this.$events[ event ] = [];
			this.$events[ event ].push( {
				listener: 	listener
				, once: 	once === true
			} );

			if ( event !== "listener" ) this.emit( "listener", event, listener, once === true );
			return this;
		}
	} );
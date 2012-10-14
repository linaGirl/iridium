	"use strict";


	var Class = require( "./class" );


	// cutom events, because they less suck
	module.exports = new Class( {
		
		$events: {}

		, emit: function( event ){
			var args = arguments, i, current;

			if ( this.$events[ event ] ){
				i = this.$events[ event ].length;
				while( i-- ){
					current = this.$events[ event ][ i ];
					if ( typeof current.listener === "function" ){
						current.listener.apply( null, Array.prototype.slice.call( args, 1 ) );
						if ( current.once ) this.$events[ event ].splice( i, 1 );
					}
					else {
						throw new Error( "cannot emit event [" + event + "], listener is typeof [" + typeof current.listener + "]!" );
						this.$events[ event ].splice( i, 1 );
					}
				}
			}

			return this;
		}


		, emitNow: function(){
			this.emit.apply( this, arguments );

			return this;
		}


		, listener: function( event ){
			return this.$events[ event ] || [];
		}


		// remove all event s( no args ), all listeners of a specific event ( first arg ) or a specific listener ( two args )
		, off: function( event, listener ){
			var i;

			if ( event ){
				if ( listener && this.$events[ event ] ){
					i = this.$events[ event ].length;
					while( i-- ){
						if ( this.$events[ event ][ i ].listener === listener ){
							this.$events[ event ].splice( i, 1 );
						}
					}
				}
				else {
					if ( this.$events[ event ] ) delete this.$events[ event ];
				}
			}
			else {
				this.$events = {};
			}

			this.emit( "removeListener", event, listener );

			return this;
		}


		// add one ( two args ) or multiple events ( one arg -> object ). fired once.
		, once: function( event, listener ){
			this.on( event, listener, true );

			return this;
		}

		// add one ( two args ) or multiple events ( one arg -> object ). fired once ( third arg )
		, on: function( event, listener, once ){
			var keys, i;
			if ( typeof event === "object" ){
				// multiple events
				keys = Object.keys( event );
				i = keys.length;
				while( i-- ){
					this.addListener( keys[ i ], event[ keys[ i ] ], once );
				}
			}
			else {
				this.addListener( event, listener, once );
			}

			return this;
		}

		// adds a listenr, somehow private
		, addListener: function( event, listener, once ){
			if ( ! this.$events[ event ] ) this.$events[ event ] = [];
			this.$events[ event ].push( {
				listener: listener
				, once: once === true
			} );

			if ( event !== "listener" ) this.emit( "listener", event, listener, once === true );
		}

		// kill myself
		, destroy: function(){
			this.$events = {}; // be nice, let the user re-use this object
		}
	} );
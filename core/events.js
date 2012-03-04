


	require( "./class" );


	// cutom events, because they less suck
	module.exports = Events = new Class( {
		$id: "events"
		
		, $events: {}

		, emit: function( event ){
			var i, current;

			if ( this.$events[ event ] ){
				i = this.$events[ event ].length;
				while( i-- ){
					current = this.$events[ event ][ i ];
					if ( typeof current.listener === "function" ){
						current.listener.apply( null, Array.prototype.slice.call( arguments, 1 ) );
						if ( current.once ) this.$events[ event ].splice( i, 1 );
					}
					else {
						this.$events[ event ].splice( i, 1 );
					}
				}
			}
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
		}


		// add one ( two args ) or multiple events ( one arg -> object ). fired once.
		, once: function( event, listener ){
			this.on( event, listener, true );
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
		}

		// adds a listenr, somehow private
		, addListener: function( event, listener, once ){
			if ( ! this.$events[ event ] ) this.$events[ event ] = [];
			this.$events[ event ].push( {
				listener: listener
				, once: once === true
			} );

			this.emit( "listener", event, listener, once === true );
		}

		// kill myself
		, destroy: function(){
			this.$events = {}; // be nice, let the user reuse this object
		}
	} );
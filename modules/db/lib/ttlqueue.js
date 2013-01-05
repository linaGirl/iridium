


	var Class = iridium( "class" )
		, Events = iridium( "events" );



	module.exports = new Class( {
		inherits: Events

		, __queue: []

		, init: function( options ){
			this.__ttl = options.ttl || 10000;
			this.__limit = options.limit || 1000;

			setInterval( this.__checkTimeout.bind( this ), 1000 );
		}

		, add: function( item ){
			this.__queue.push( {
				time: Date.now()
				, item: item
			} );

			if ( this.__queue.length ) this.__removeOldest();
		}

		, hasItems: function(){
			return this.__queue.length > 0;
		}

		, getOldest: function(){
			return this.hasItems() ? this.__queue.shift() : null;
		}

		, __removeOldest: function(){
			this.emit( "autoremove", this.__queue.shift() );
		}


		, __checkTimeout: function(){
			var oldestTime = Date.now() - this.__ttl;

			for( var i = 0; i < this.__queue.length; i++ ){
				if ( this.__queue[ i ].time <= oldestTime ){
					this.emit( "autoremove", this.__queue.splice( i, 1 ) );
					i--;
				}
				else return;
			}
		}
	} );
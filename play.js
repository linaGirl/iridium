	
	
	require( "./" )( "play", 1 );

	var Class = iridium( "class" )
		, log = iridium( "log" );





	var LRUCache = new Class( {
		$id: "LRUCache"

		, __limit: 100000

		, __data: {}

		, __first: null
		, __last: null

		, __count: 0



		, init: function( options ){
			if ( options.limit ) this.__limit = options.limit;
		}


		, set: function( id, data ){
			if ( this.__data[ id ] ){
				// update
				this.__data[ id ].v = data;
				this.__appendToList( this.__removeFromList( id ) );
			}
			else {
				// create new
				this.__data[ id ] = { id: id, p: null, n: null, v: data };
				this.__appendToList( this.__data[ id ] );
				this.__count++;

				if ( this.__count > this.__limit ){
					this.remove( this.__first );
				}
			}
		}



		, get: function( id ){
			if ( this.__data[ id ] ){

				// reposition item
				this.__appendToList( this.__removeFromList( id ) );

				// return
				return this.__data[ id ];
			}
			return null;
		}



		, remove: function( id ){
			var x = Date.now();
			var item = this.__removeFromList( id );
			if ( item ) delete this.__data[ id ];
			this.__count--;
			console.log( "removed ", item.id, Date.now() - x );
			return item.v;
		}



		// add to linked list
		, __appendToList: function( item ){

			if ( this.__first ){
				// there is at least on item
				this.__data[ this.__last ].n = item.id;
				item.p = this.__last;
				this.__last = item.id;
			}
			else {
				// this is the first item
				this.__first = item.id;
				this.__last = item.id;
			}
		}



		// remove from linked list
		, __removeFromList: function( id ){
			var current = this.__data[ id ], previous, next;

			// does the item exist ?
			if ( current ){
				previous 	= current.p ? this.__data[ current.p ] : null;
				next 		= current.n ? this.__data[ current.n ] : null;

				if ( previous ){
					// not the first element					
					if ( next ){
						// there is a next element too
						next.p = previous.id;
						previous.n = next.id;
					}
					else {
						// last element
						this.__last = previous.id;
						previous.n = null;
					}
				}
				else {
					// this was the first element
					if ( next ){
						// there are other items
						this.__first = next.id;
						next.p = null;
					}
					else {
						// this was the only item, remove it
						this.__first = null;
						this.__last = null;						
					}
				}

				current.p = null;
				current.n = null;
				return current;
			}
			return null;
		}
	} );




	var c = new LRUCache();


	var createId = function( no ){ return require( "crypto" ).createHash( "sha512" ).update( ( no || counter++ ) + "x" ).digest( "hex" ); };

	var counter 	= 0;



	for ( var i = 0, l = 100000; i < l; i++ ){
		c.set( createId(), {} );
	}

	setInterval( function(){
		c.set( createId(), {} );
	}, 100 );


	setInterval( function(){
		c.get( createId( Math.floor( Math.random() * counter ) ), {} );
	}, 100 );


	setInterval( function(){
		c.set( createId( Math.floor( Math.random() * counter ) ), {} );
	}, 100 );


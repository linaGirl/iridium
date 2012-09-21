

	var Class = iridium( "class" );


	var crypto = require( "crypto" );


	module.exports = new Class( {
		$id: "randomPool"


		, __data: null
		, __offset: 0

		, __minBufferSize: 64000 // 1000 * 64 bytes
		, __targetBufferSize: 256000 // 4000 * 64 bytes
		, __callbacks: []
		, __fetching: false



		, get offset(){
			return this.__offset;
		}
		, set offset( offset ){
			this.__offset = offset < 0 ? 0 : offset ;
		}



		, init: function( options ){
			this.__data = new Buffer( this.__targetBufferSize );
			this.__getData();
		}



		// return random data
		, get: function( amount, callback ){
			if ( this.offset >= amount ){
				this.offset -= amount;
				if ( !this.__fetching &&  this.offset < this.__minBufferSize ) this.__getData();

				if ( callback ){
					callback( this.__data.slice( this.offset, this.offset + amount ) );
				}
				else {
					return this.__data.slice( this.offset, this.offset + amount );
				}
			}
			else {
				if ( callback ){
					this.__callbacks.push( { amount: amount, callback: callback } );
				}
				else {
					return;
				}
			}
		}






		, __getData: function(){
			if ( ! this.__fetching ){
				this.__fetching = true;
				crypto.randomBytes( this.__targetBufferSize - this.offset, function( err, data ){
					if ( err ){
						log.warn( "failed to get random data!" );
						this.__fetching = false;
					}
					else {
						data.copy( this.__data, this.offset );
						this.offset += data.length;
						this.__fetching = false;

						var current, l = i = this.__callbacks.length;
						while( i-- ){
							current = this.__callbacks[ l - i - 1 ];
							if ( this.offset >= current.amount ){
								this.get( current.amount, current.callback );
								this.__callbacks.splice( l - i - 1, 1 );
							}
						}
					}
				}.bind( this ) );
			}
		}
	} );
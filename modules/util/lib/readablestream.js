

	var core = iridium( "core" );



	module.exports = new core.Class( {
		inherits: core.Events

		, __offset: 0
		, __chunksize: 10240
		, __data: null
		, __paused: false

		, readable: true


		, init: function( options ){
			this.__data = options.data;

			process.nextTick( this.__emitData.bind( this ) );
		}


		, pause: function(){
			this.__paused = true;
		}

		, resume: function(){
			this.__paused = false;
			this.__emitData();
		}

		, __emitData: function(){
			if ( !this.__paused ){
				if ( this.__offset < this.__data.length ){
					process.nextTick( function(){
						var chunksize = ( this.__offset + this.__chunksize <= this.__data.length ) ? this.__chunksize : ( this.__data.length - this.__offset );
						
						if ( this.__encoding ){
							this.emit( "data", this.__data.slice( this.__offset, chunksize ).toString( this.__encoding ) );
						}
						else {
							this.emit( "data", this.__data.slice( this.__offset, chunksize ) );
						}
						
						this.__offset + this.__chunksize;
					}.bind( this ) );
				}
				else {
					this.readable = false;
					this.emit( "end" );
				}
			}
		}

		, destroy: function(){
			this.__paused = true;
		}

		, pipe: function( writestream ){
			if ( writestream.writable ){
				writestream.end( this.__data );
			}
			else {
				process.nextTick( function(){
					this.pipe( writestream );
				}.bind( this ) );
			}
		}

		, setEncoding: function( encoding ){
			this.__encoding = encoding;
		}

		, isStream: function(){
			return true;
		}
	} );
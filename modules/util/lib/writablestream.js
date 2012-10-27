


	var core = iridium( "core" );



	module.exports = new core.Class( {
		inherits: core.Events

		, writable: true

		, pipe: function( readablestream ){
			var handleData = function( data ){
				if ( ! this.__data ) this.__data = data;
				else {
					var buf = new Buffer( this.__data.length + data.length );
					this.__data.copy( buf );
					data.copy( buf, this.__data.length );
					this.__data = buf;
				}
			}.bind( this );

			readablestream.on( "data", handleData );
			readablestream.on( "end", function( data ){
				if ( data ) handleData( data );
				this.emit( "end", this.__data );
			}.bind( this ) );
			return this;
		}
	} );
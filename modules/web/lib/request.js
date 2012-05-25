

	var Class = iridium( "class" )
		, Events = iridium( "events" )
		, log = iridium( "log" );







	module.exports = new Class( {
		$id: "web.request"
		, inherits: Events


		, __buffer: ""
		, __ended: false


		, init: function( options ){
			this.__request = options.request;
			this.headers = this.__request.headers;
			this.url = this.__request.url;

			this.__request.on( "data", 	this.__handleData.bind( this ) );
			this.__request.on( "end", 	this.__handleEnd.bind( this ) );

			this.on( "listener", this.__handleListener.bind( this ) );
		}


		, __handleListener: function( evt, listener ){
			if ( evt === "data" ){
				if ( this.__buffer.length > 0 ) listener( this.__buffer );
			}
			else if ( evt === "end" ){
				if ( this.__ended ){
					listener();
					this.off();
				}
			}
		}


		, __handleData: function( chunk ){
			this.emit( "data", chunk );
			this.__buffer += chunk;
		}


		, __handleEnd: function(){
			this.emit( "end" );
			this.__ended = true;

			if ( this.listener( "end" ).length > 0 ){
				this.off();
			}
		}

	} );
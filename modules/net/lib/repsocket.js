



	var Class = iridium( "class" )
		, Events = iridium( "events" )
		, log = iridium( "log" )
		, TinyNet = require( "./tinynet" );


	//console.dir( Events );


	module.exports = new Class( {
		$id: "net.RepSocket"
		, inherits: Events

		, init: function( options ){
			this.__tinyNet = new TinyNet();
			
			if ( options.bind ){
				this.__bind( options.bind );
			}
		}


		, __handleClose: function(){
			this.__emit( "close" );
		}

		, __handleError: function( err ){
			this.emit( "error", err );
		}

		, __handleMessage: function(){
			log.dir( arguments );
		}



		// bind ths socket, start accepting data
		, __bind: function( config ){
			
		}
	} );


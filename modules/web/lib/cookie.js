

	var Class 			= iridium( "class" )
		, log 			= iridium( "log" );



	

	module.exports = new Class( {
		$id: "server.cookie"

		, __value: ""
		, __name: "iridium"
		, __secure: false
		, __httponly: true



		, init: function( options ){
			if ( options.name ) 				this.__name 		= options.name;
			if ( options.value ) 				this.__value 		= options.value;
			if ( options.expires ) 				this.__expires 		= options.expires.toUTCString();
			if ( options.remove ) 				this.__expires 		= new Date( 0 ).toUTCString();
			if ( options.maxage ) 				this.__maxage 		= options.maxage;
			if ( options.secure ) 				this.__secure 		= true;
			if ( options.httponly === false ) 	this.__httponly 	= false;
			if ( options.domain ) 				this.__domain 		= options.domain;
			if ( options.path ) 				this.__path			= options.path;
		}



		, toString: function(){
			var options = [ this.__name + "=" + this.__value ];

			if ( this.__expires ) 	options.push( "Expires=" + this.__expires );
			if ( this.__maxage ) 	options.push( "Max-Age=" + this.__maxage );
			if ( this.__domain ) 	options.push( "Domain=" + this.__domain );
			if ( this.__path ) 		options.push( "Path=" + this.__path );
			if ( this.__httponly ) 	options.push( "HttpOnly" );
			if ( this.__secure ) 	options.push( "Secure" );

			return options.join( "; " ); 
		}
	} );

	


	module.exports = {
		  bold: 		[ 1, 22 ]
		, italic: 		[ 3, 23 ]
		, underline: 	[ 4, 24 ]
		, inverse: 		[ 7, 27 ]

		, white: 		[ 37, 39 ]
		, grey: 		[ 90, 39 ]
		, black: 		[ 90, 39 ]
		, blue: 		[ 34, 39 ]
		, cyan: 		[ 36, 39 ]
		, green: 		[ 32, 39 ]
		, magenta: 		[ 35, 39 ]
		, red: 			[ 31, 39 ]
		, yellow: 		[ 33, 39 ]


		, style: function( str, style ){
			if ( style.length > 2 ) str = this.style( str, style.slice( 2 ) );
			return "\x1b[" + style[ 0 ] + "m" + str + "\x1b[" + style[ 1 ] + "m";
		}

		, pad: function( text, len, char, invert ){
			text = text + "";
			return text.length >= len ? text : ( invert ? text + new Array( len - text.length + 1).join( char || " " ) : new Array( len - text.length + 1).join( char || " " ) + text );			
		}

		, camelCase: function(){
			return Array.prototype.slice.call( arguments, 0 ).map( function( i, index ){ 
				return index === 0 ? i : ( i.length > 0 ? ( i.length > 1 ? i[ 0 ].toUpperCase() + i.substr( 1 ) : i.toUpperCase() ) : i ); 
			}).join( "" );
		}
	}
	"use strict";

	// silly simple class
	( function(){

		
		// colorful strings
		var stylize = function ( str, style ) {
			var styles = {
				  "bold": 		[ 1, 22 ]
				, "italic": 	[ 3, 23 ]
				, "underline": 	[ 4, 24 ]
				, "inverse": 	[ 7, 27 ]
				, "white": 		[ 37, 39 ]
				, "grey": 		[ 90, 39 ]
				, "black": 		[ 90, 39 ]
				, "blue": 		[ 34, 39 ]
				, "cyan": 		[ 36, 39 ]
				, "green": 		[ 32, 39 ]
				, "magenta": 	[ 35, 39 ]
				, "red": 		[ 31, 39 ]
				, "yellow": 	[ 33, 39 ]
			};
			return '\x1b[' + ( styles[ style ][ 0 ] ) + "m" + str + '\x1b[' + ( styles[ style ][ 1 ] ) + "m";
		};
		
		[ "bold", "underline", "italic", "inverse", "grey", "yellow", "red", "green", "blue", "white", "cyan", "magenta" ].forEach( function( style ) {
			Object.defineProperty( String.prototype, style, {
				get: function () {
					return stylize(this, style);
				}
			} );
		} );


		exports.init = function( scope ){}
	} )();


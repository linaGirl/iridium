


	var Class 		= iridium( "class" )
		, Events 	= iridium( "events" )
		, log 		= iridium( "log" );

	var Cookie 		= require( "./cookie" );

	var url 		= require( "url" );




	module.exports = new Class( {
		
		__headers: []


		, get pathname(){			
			return decodeURIComponent( this.getUri().pathname );
		}

		, get hostname(){			
			return this.getUri().hostname;
		}

		, get query(){	
			return this.getUri().query;
		}

		, get language(){
			var lang = /^\/([a-z]{2})\//gi.exec( this.pathname );
			if ( lang ) return lang[ 1 ].toLowerCase();
			return null;
		}


		, init: function( options ){
			this.__request = options.request;
			if ( !this.__request.headers ) this.__request.headers = {};
		}

		, hasQueryParameter: function( key, value ){
			var query = this.query;
			if ( query ){
				if ( value !== undefined && query.hasOwnProperty( key ) && query[ key ] == value ) return true;
				else if ( value === undefined && query.hasOwnProperty( key ) ) return true;
			}
			return false;
		}

		, addTrailingSlash: function( input ){
			if ( typeof input === "string" ){
				return input + input[ input.length - 1 ] === "/" ? "" : "/";
			}
			throw new Error( "cannnot add slash to non string: " + input );
		}

		, getCookie: function( cookiename ){
			return ( new RegExp( cookiename + "=([^;]+)(?:;|$)", "gi" ).exec( this.getHeader( "cookie" ) ) || [ null, null ] )[ 1 ];
		}

		, getHeader: function( name, parsed ){
			if ( this.__request.headers[ name ] ){
				if ( parsed ){
					return this.__parseHeader( this.__request.headers[ name ] )
				}
				else {
					return this.__request.headers[ name ]
				}
			}
			return null;
		}

		, hasHeader: function( name ){
			return !!this.__request.headers[ name ];
		}

		, getUri: function(){
			if ( ! this.__uri ) this.__uri = url.parse( "http://" + this.__request.headers.host + this.__request.url, true );
			return this.__uri;
		}

		, __parseHeader: function( header ){
			var parts = header.split( "," ).map( function( part ){
				var items = /^([a-z]+)\-?([a-z]*)\;?q?=?([0-9\.]*)$/gi.exec( part );

				return {
					  value: 		items && items[ 1 ] ? items[ 1 ].toLowerCase() : ""
					, value2: 		items && items[ 2 ] ? items[ 2 ].toLowerCase() : ""
					, q: 			items && items[ 3 ] ? items[ 3 ] : 1
				};
			} ).sort( function( a, b ){ return a.q > b.q ? -1 : 1 } );
			return parts.length > 0 ? parts: null;
		}
	} );
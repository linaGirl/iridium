


	var Class 		= iridium( "class" )
		, Events 	= iridium( "events" )
		, log 		= iridium( "log" )
		, argv 		= iridium( "util" ).argv
		, debug 	= argv.has( "trace-webservice" )
		, userDebug = argv.has( "debug" );


	var Cookie 		= require( "./cookie" );

	var url 		= require( "url" )
		, zlib 		= require( "zlib" );




	module.exports = new Class( {
		
		  __headers: {}
		, __statusCode: 500
		, __responseSent: false

		, init: function( options ){
			this.__response = options.response;
			this.__request = options.request;
		}


		, get isSent(){
			return this.__responseSent;
		}


		, setContentType: function( type ){
			this.setHeader( "content-type", type );
		}

		, setCookie: function( cookie ){
			if ( ! this.__headers.cookies ) this.__headers.cookies = [];
			this.setHeader( "set-cookie", typeof cookie === "string" ? cookie : cookie.toString() );
			return this;
		}

		, setHeader: function( header, value ){
			if ( ! this.__headers[ header ] ) this.__headers[ header ] = [];
			this.__headers[ header ].push( value );
			return this;
		}


		, setHeaders: function( headers ){
			if ( headers ){
				var keys = Object.keys( headers ), i = keys.length;
				while( i-- ) this.setHeader( keys[ i ], headers[ keys[ i ] ] );
			}
			return this;
		}

		, removeHeader: function( header ){
			if ( this.__headers[ header ] ) delete this.__headers[ header ];
		}



		, render: function( file, language, content, partial ){
			var rendering, acceptEncoding = this.__request.getHeader( "accept-encoding" );

			if ( userDebug && this.__request.hasQueryParameter( "format", "json" ) ){
				rendering = JSON.stringify( content, null, "    "  );
				this.setHeader( "content-type", "application/json; charset=utf-8" );
			}
			else {
				if ( language ) rendering = file.templates[ language ].render( content, partial );
				else rendering = file.template.render( content, partial );					
				this.setHeader( "content-type", file.type );
			}


			if ( acceptEncoding && acceptEncoding.indexOf( "gzip" ) >= 0 ){
				zlib.gzip( rendering, function( err, compressedData ){
					if ( err ) {
						this.send( 200, null, rendering );
					}
					else {
						this.__response.setHeader( "content-encoding", "gzip" );
						this.send( 200, null, compressedData );
					}
				}.bind( this ) );
			}
			else {
				this.send( 200, null, rendering );
			}
		}



		, sendCompressed: function( statusCode, headers, data ){
			var acceptEncoding = this.__request.getHeader( "accept-encoding" );
			
			if ( acceptEncoding && acceptEncoding.indexOf( "gzip" ) >= 0 ){
				if ( debug ) log.debug( "compressing response ..." );
				zlib.gzip( data, function( err, compressedData ){
					if ( err ) this.send( statusCode, headers, data );
					else {
						if ( compressedData.length < data.length ){
							if ( debug ) log.debug( "seding compressed response [" + compressedData.length + "] ( compressed ) vs [" + data.length + "] bytes ..." );
							this.__response.setHeader( "content-encoding", "gzip" );
							this.send( statusCode, headers, compressedData );
						}
						else {
							this.send( statusCode, headers, data );
						}						
					}
				}.bind( this ) );
			}
			else {
				this.send( statusCode, headers, data );
			}	
		}



		, send: function( statusCode, headers, data ){
			this.setHeaders( headers );

			if ( !data ) data = "";
			if ( typeof data === "string" ) data = new Buffer( data );
			this.setHeader( "Content-Length", data.length );
			this.setHeader( "date", new Date().toGMTString() );
			this.setHeader( "server", "nginx" );

			// this resource wont expire! ( expire in 10 years )
			if ( this.__request.hasQueryParameter( "__icv" ) ) {
				this.setHeader( "max-age", 3600 * 24 * 365 );
				this.setHeader( "expires", new Date( 2050, 1, 1 ).toGMTString() );
				//this.removeHeader( "etag" );
			}

			this.__response.writeHead( statusCode || this.__statusCode, this.__headers );
			this.__response.end( data );
			this.__responseSent = true;

			if ( debug ) log.warn( "sent response for [" + this.__request.pathname + "] - headers:" ), log.dir( this.__headers );

			return this;
		}



		, sendFile: function( file ){
			var acceptEncoding = this.__request.getHeader( "accept-encoding" );

			this.setHeader( "ETag", file.etag );
			this.setHeader( "content-type", file.type );

			if ( acceptEncoding && file.gzip && acceptEncoding.indexOf( "gzip" ) >= 0 ){
				this.__response.setHeader( "content-encoding", "gzip" );
				this.send( 200, null, file.gzip )
			}
			else {
				this.send( 200, null, file.file );
			}			
		}

		, sendError: function( statusCode, reason ){
			if( debug ) log.warn( statusCode, reason );
			this.send( statusCode, { "content-type": "text/html" }, reason );
			return this;
		}
	} );
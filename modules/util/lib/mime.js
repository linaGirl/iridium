

	
	var Class = iridium( "class" );


	var Mime = module.exports = new Class( {
		$id: "Mime"

				
		, __mimeMap: {
			  txt:			"text/plain"
			, atom:			"application/atom+xml"
			, json:			"application/json"
			, js:			"application/javascript"
			, jsm:			"application/javascript"
			, unknown:		"application/octet-stream"
			, bin:			"application/octet-stream"
			, ogg:			"application/ogg"
			, pdf:			"application/pdf"
			, wof:			"application/x-woff"
			, xhtml:		"application/xhtml+xml"
			, zip:			"application/zip"
			, mp4:			"audio/mp4"
			, mp3:			"audio/mpeg"
			, wav:			"audio/vnd.wave"
			, webm:			"audio/webm"
			, gif:			"image/gif"
			, jpg:			"image/jpeg"
			, jpeg:			"image/jpeg"
			, png:			"image/png"
			, svg:			"image/svg+xml"
			, tiff:			"image/tiff"
			, ico:			"image/vnd.microsoft.icon"
			, ttf:			"application/x-font-ttf"
			, css:			"text/css"
			, cssm:			"text/css"
			, csv:			"text/csv"
			, html:			"text/html"
			, jbx:			"text/html"
			, xml:			"text/xml"
			, tpl:			"text/html"
			, tplm:			"text/html"
			, pong:			"text/html"
		}
		
		
		, __utf8: [
			"txt", "atom", "json", "js", "xhtml", "css", "csv", "html", "jbx", "xml", "tpl", "cssm", "jsm", "tplm"
		]
	
		
		, __default: "bin"
		
		
		
		// is binary
		, isBinary: function( ext ){
			return this.__utf8.indexOf( ext ) === -1;
		}
		
		
		, exists: function( extension ){
			return this.__mimeMap[ extension ] ? true : false ;
		}
		
		
		


		, get: function( extension, charset ){
			var type = "";
			
			if ( this.exists( extension ) ){
				type = this.__mimeMap[ extension ];
			}
			else{
				type = this.__mimeMap[ this.__default ];
			}
			
			if ( charset && charset.trim().toLowerCase() === "utf8" ){
				charset = "utf-8";
			}
			
			if ( ! charset && this.__utf8.indexOf( extension ) > -1 ){
				charset = "utf-8";
			}
			
			return type += ( charset ? "; charset=" + charset : "" );
		}
	} );
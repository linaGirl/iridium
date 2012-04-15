	"use strict";



	module.exports = {

		__types: {
			  txt:			{ defaultCharset: "utf-8", type: "text/plain" }
			, atom:			{ defaultCharset: "utf-8", type: "application/atom+xml" }
			, json:			{ defaultCharset: "utf-8", type: "application/json" }
			, js:			{ defaultCharset: "utf-8", type: "application/javascript" }
			, jsm:			{ defaultCharset: "utf-8", type: "application/javascript" }
			, mjs: 			{ defaultCharset: "utf-8", type: "application/javascript" }
			, unknown:		{ defaultCharset: "binary", type: "application/octet-stream" }
			, bin:			{ defaultCharset: "binary", type: "application/octet-stream" }
			, ogg:			{ defaultCharset: "binary", type: "application/ogg" }
			, pdf:			{ defaultCharset: "binary", type: "application/pdf" }
			, wof:			{ defaultCharset: "binary", type: "application/x-woff" }
			, xhtml:		{ defaultCharset: "utf-8", type: "application/xhtml+xml" }
			, zip:			{ defaultCharset: "binary", type: "application/zip" }
			, mp4:			{ defaultCharset: "binary", type: "audio/mp4" }
			, mp3:			{ defaultCharset: "binary", type: "audio/mpeg" }
			, wav:			{ defaultCharset: "binary", type: "audio/vnd.wave" }
			, webm:			{ defaultCharset: "binary", type: "audio/webm" }
			, gif:			{ defaultCharset: "binary", type: "image/gif" }
			, jpg:			{ defaultCharset: "binary", type: "image/jpeg" }
			, jpeg:			{ defaultCharset: "binary", type: "image/jpeg" }
			, png:			{ defaultCharset: "binary", type: "image/png" }
			, svg:			{ defaultCharset: "utf-8", type: "image/svg+xml" }
			, tiff:			{ defaultCharset: "binary", type: "image/tiff" }
			, ico:			{ defaultCharset: "binary", type: "image/vnd.microsoft.icon" }
			, ttf:			{ defaultCharset: "binary", type: "application/x-font-ttf" }
			, css:			{ defaultCharset: "utf-8", type: "text/css" }
			, cssm:			{ defaultCharset: "utf-8", type: "text/css" }
			, csv:			{ defaultCharset: "utf-8", type: "text/csv" }
			, html:			{ defaultCharset: "utf-8", type: "text/html" }
			, jbx:			{ defaultCharset: "utf-8", type: "text/html" }
			, xml:			{ defaultCharset: "utf-8", type: "text/xml" }
			, tpl:			{ defaultCharset: "utf-8", type: "text/html" }
			, tplm:			{ defaultCharset: "utf-8", type: "text/html" }
			, pong:			{ defaultCharset: "utf-8", type: "text/html" }
			, _:			{ defaultCharset: "binary", type: "" }
		}


		, getType: function( extension ){
			if ( this.__types[ extension ] ){
				return this.__types[ extension ];
			}
			else {
				return this.__types[ "_" ]; 
			}
		}
		

		, isBinary: function( extension ){
			if ( this.__types[ extension ] ){
				return this.__types[ extension ].defaultCharset === "binary";
			}
			else {
				return true;
			}
		}


		, get: function( extension ){
			if ( this.__types[ extension ] ){
				return this.__types[ extension ].type + ( this.__types[ extension ].defaultCharset ? ( "; charset=" + this.__types[ extension ].defaultCharset ) : "" );
			}
			else {
				return "";
			}
		}
	};
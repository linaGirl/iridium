	"use strict";



	module.exports = {

		__types: {
			  txt:			{ defaultCharset: "utf-8", type: "text/plain" }
			, atom:			{ defaultCharset: "utf-8", type: "application/atom+xml" }
			, json:			{ defaultCharset: "utf-8", type: "application/json" }
			, js:			{ defaultCharset: "utf-8", type: "application/javascript" }
			, jsm:			{ defaultCharset: "utf-8", type: "application/javascript" }
			, unknown:		{ defaultCharset: "", type: "application/octet-stream" }
			, bin:			{ defaultCharset: "", type: "application/octet-stream" }
			, ogg:			{ defaultCharset: "", type: "application/ogg" }
			, pdf:			{ defaultCharset: "", type: "application/pdf" }
			, wof:			{ defaultCharset: "", type: "application/x-woff" }
			, xhtml:		{ defaultCharset: "utf-8", type: "application/xhtml+xml" }
			, zip:			{ defaultCharset: "", type: "application/zip" }
			, mp4:			{ defaultCharset: "", type: "audio/mp4" }
			, mp3:			{ defaultCharset: "", type: "audio/mpeg" }
			, wav:			{ defaultCharset: "", type: "audio/vnd.wave" }
			, webm:			{ defaultCharset: "", type: "audio/webm" }
			, gif:			{ defaultCharset: "", type: "image/gif" }
			, jpg:			{ defaultCharset: "", type: "image/jpeg" }
			, jpeg:			{ defaultCharset: "", type: "image/jpeg" }
			, png:			{ defaultCharset: "", type: "image/png" }
			, svg:			{ defaultCharset: "utf-8", type: "image/svg+xml" }
			, tiff:			{ defaultCharset: "", type: "image/tiff" }
			, ico:			{ defaultCharset: "", type: "image/vnd.microsoft.icon" }
			, ttf:			{ defaultCharset: "", type: "application/x-font-ttf" }
			, css:			{ defaultCharset: "utf-8", type: "text/css" }
			, cssm:			{ defaultCharset: "utf-8", type: "text/css" }
			, csv:			{ defaultCharset: "utf-8", type: "text/csv" }
			, html:			{ defaultCharset: "utf-8", type: "text/html" }
			, jbx:			{ defaultCharset: "utf-8", type: "text/html" }
			, xml:			{ defaultCharset: "utf-8", type: "text/xml" }
			, tpl:			{ defaultCharset: "utf-8", type: "text/html" }
			, tplm:			{ defaultCharset: "utf-8", type: "text/html" }
			, pong:			{ defaultCharset: "utf-8", type: "text/html" }
		}


		, getType: function( extension ){
			return this.__types[ extension ] || { type: "", defaultCharset: "" };
		}
	};
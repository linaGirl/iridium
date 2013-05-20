

	var Class 		= iridium( "class" )
		, log 		= iridium( "log" )
		, argv	 	= iridium( "util" ).argv
		, debug 	= argv.has( "trace-all" ) || argv.has( "trace-rest" );


	module.exports = new Class( {

		  __validVerbs: [ "head", "get", "put", "post", "delete" ]


		, __statusMap:{
			  100: "Continue"
			, 101: "Switching Protocols"
			, 102: "Processing"
			, 200: "OK"
			, 201: "Created"
			, 202: "Accepted"
			, 203: "Non-Authoritative Information"
			, 204: "No Content"
			, 205: "Reset Content"
			, 204: "response"
			, 206: "Partial Content"
			, 207: "Multi-Status"
			, 208: "Already Reported"
			, 226: "IM Used"
			, 300: "Multiple Choices"
			, 301: "Moved Permanently"
			, 302: "Found"
			, 303: "See Other"
			, 304: "Not Modified"
			, 305: "Use Proxy"
			, 306: "Switch Proxy"
			, 307: "Temporary Redirect"
			, 308: "Permanent Redirect"
			, 400: "Bad Request"
			, 401: "Unauthorized"
			, 403: "Forbidden"
			, 402: "Payment Required"
			, 403: "Forbidden"
			, 404: "Not Found"
			, 405: "Method Not Allowed"
			, 406: "Not Acceptable"
			, 407: "Proxy Authentication Required"
			, 408: "Request Timeout"
			, 409: "Conflict"
			, 410: "Gone"
			, 411: "Length Required"
			, 412: "Precondition Failed"
			, 413: "Request Entity Too Large"
			, 414: "Request-URI Too Long"
			, 415: "Unsupported Media Type"
			, 416: "Requested Range Not Satisfiable"
			, 417: "Expectation Failed"
			, 418: "I'm a teapot"
			, 420: "Enhance Your Calm"
			, 422: "Unprocessable Entity"
			, 423: "Locked"
			, 424: "Method Failure"
			, 425: "Unordered Collection"
			, 426: "Upgrade Required"
			, 428: "Precondition Required"
			, 429: "Too Many Requests"
			, 431: "Request Header Fields Too Large"
			, 444: "No Response"
			, 451: "Unavailable For Legal Reasons"
			, 494: "Request Header Too Large"
			, 495: "Cert Error"
			, 496: "No Cert"
			, 497: "HTTP to HTTPS"
			, 499: "Client Closed Request"
			, 500: "Internal Server Error"
			, 501: "Not Implemented"
			, 502: "Bad Gateway"
			, 503: "Service Unavailable"
			, 504: "Gateway Timeout"
			, 505: "HTTP Version Not Supported"
			, 506: "Variant Also Negotiates"
			, 507: "Insufficient Storage "
			, 508: "Loop Detected"
			, 509: "Bandwidth Limit Exceeded"
			, 510: "Not Extended"
			, 511: "Network Authentication Required"
			, 598: "Network read timeout error"
			, 599: "Network connect timeout error"
		}


		, init: function( options ){
			this.controllers 	= options.controllers;
			this.rest 			= options.rest;
			this.schemas 		= options.schemas;
			this.resources 		= options.resources;
			this.sessions 		= options.sessions;
			this.files 			= options.files;
			this.__name			= options.name;
			this.__namespace 	= options.namespace;

			this.__uri			= iridium.app.config.protocol + this.__namespace + ".apis." + iridium.app.config.host + "/";

			if ( !options.isSubControllerInit ){
				// try to load resource controller ( this is the collectioncontroller )
				try {
					options.isSubControllerInit = true;
					this.resource = new ( require( options.path + "/" + options.name + "-resource" ) )( options );
				} catch ( e ){
					log.warn( "failed to load resource for collection [" + options.name + "]: " + e, this );
				}
			}

			process.nextTick( function(){
				if ( typeof this.initialize === "function" ) this.initialize();
			}.bind( this ) ); 
		}



		, respond: function( request, response, status, data ){
			var renderer = this.rest.getRenderer( request.getHeader( "accept", true ) );

			if ( renderer ) {
				if ( !data ) data = {};
				if ( !data.status ){
					if ( this.__statusMap[ status ] ){
						data.status = this.__statusMap[ status ];
					}
					else {
						status = 500;
						data = { status: this.__statusMap[ status ] };
					}
				}

				// delete error description when not debugging on internal server errrors
				if ( !debug && status === 500 && data.description ) delete data.description;

				data.statusCode = status;

				// respond
				response.sendCompressed( status, renderer.getHeaders(), renderer.render( request, response, status, data ) );
			}
			else response.send( 500, {}, "no renderer available!" );
		}

		

		, hasVerb: function( verb ){
			return this.__validVerbs.indexOf( verb ) >= 0 && typeof this[ verb ] === "function";
		}
	} );
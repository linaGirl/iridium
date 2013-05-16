

	var Class 		= iridium( "class" )
		, log 		= iridium( "log" );


	module.exports = new Class( {

		  __validVerbs: [ "head", "get", "put", "post", "delete" ]



		, init: function( options ){
			this.controllers 	= options.controllers;
			this.rest 			= options.rest;
			this.schemas 		= options.schemas;
			this.resources 		= options.resources;
			this.sessions 		= options.sessions;
			this.files 			= options.files;
			this.__name			= options.name;

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

			if ( renderer ) response.sendCompressed( status, renderer.getHeaders(), renderer.render( request, response, status, data ) );
			else response.send( 500, {}, "no renderer available!" );
		}

		

		, hasVerb: function( verb ){
			return this.__validVerbs.indexOf( verb ) >= 0 && typeof this[ verb ] === "function";
		}
	} );
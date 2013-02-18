


	var Class 		= iridium( "class" )
		, log 		= iridium( "log" );


	module.exports = new Class( {

		init: function( options ){
			this.controllers 	= options.controllers;
			this.schemas 		= options.schemas;
			this.resources 		= options.resources;
			this.sessions 		= options.sessions;
			this.files 			= options.files;

			process.nextTick( function(){
				if ( typeof this.initialize === "function" ) this.initialize();
			}.bind( this ) ); 
		}

		, hasAction: function( action ){
			return typeof this[ action ] === "function";
		}


		, requiresSession: function( action ){
			if ( this.hasAction( action ) ){
				if ( this.__sessionRequirements && this.__sessionRequirements[ action ] !== undefined ) return this.__sessionRequirements[ action ];
				else return this.__requiresSession || false;
			}
			else throw new Error( "invalid action" );
		}


		, __redirect: function( request, response, id, language, data ){
			var command = this.resources.getCommandById( id ), controller;

			if ( command ){
				// set data on new command
				if ( typeof data === "object" && data !== null ){
					var keys = Object.keys( data ), i = keys.length;
					while( i-- ) command.data[ keys[ i ] ] = data[ keys[ i ] ];
				}
				if ( language ) command.language = language, command.data.lang = language;
				
				if ( this.controllers.has( command.controller ) ){
					controller = this.controllers.get( command.controller );

					if ( controller.hasAction( command.action ) ){
						controller[ command.action ]( request, response, command );
					}
					else {
						response.sendError( 500, "invalid_action_for_internal_redirect" );
					}
				}
				else{
					response.sendError( 500, "invalid_controller_for_internal_redirect" );
				}
			}
			else{
				response.sendError( 500, "internal_redirect_failed" );
			}
		}
	} );
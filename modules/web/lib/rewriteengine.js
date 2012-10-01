


	var Class 			= iridium( "class" )
		, Events 		= iridium( "events" )
		, log 			= iridium( "log" )
		, argv 			= iridium( "util" ).argv
		, debug 		= argv.has( "trace-all" ) || argv.has( "trace-rewrite" ) || argv.has( "trace-webservice" );



	module.exports = new Class( {
		inherits: Events

		, __rulesBefore: []
		, __rulesAfter: []


		, init: function( options ){
			this.sessions 	= options.sessions;
			this.resources 	= options.resources;
			this.chemas 	= options.schemas;

			// wait until this class was returned ( events emit immediately )
			process.nextTick( function(){ this.emit( "load" ); }.bind( this ) );
		}


		// add a rewrite parser function
		, addRule: function( before, fn, scope ){
			if ( before ) this.__rulesBefore.push( scope ? fn.bind( scope ) : fn.bind( this ) );
			else this.__rulesAfter.push( scope ? fn.bind( scope ) : fn.bind( this ) );
		}


		// do the rewrite
		, rewrite: function( request, response, callback ){
			var i = this.__rulesBefore.length
				, m = this.__rulesAfter.length
				, mainruleDone = false;


			if ( debug ) log.debug( "rewriting [" + request.pathname + "] ...", this );
			
			var nextRule = function(){
				var rule;

				if ( i > 0 ) rule = this.__rulesBefore[ --i ];
				else if ( !mainruleDone ) rule = this.__iridiumRewrite.bind( this ), mainruleDone = true;
				else if ( m > 0 ) rule = this.__rulesAfter[ --m ];

				if ( !rule ) callback();
				else {
					// execute rule
					rule( request, response, function( err, command ){
						if ( err ) callback( err );
						else if ( command ) callback( null, command );
						else nextRule();					
					}.bind( this ) );
				}				
			}.bind( this );

			nextRule();
		}


		, __iridiumRewrite: function( request, response, callback ){
			var pathname = request.pathname
				, hasLang = /^\/[a-z]{2}(?:$|\/)/i.test( pathname ) // language code delivered?
				, path =  hasLang ? pathname.substr( 3 ) : pathname // path without language
				, commandPath = path[ path.length - 1 ] === "/" ? path : path + "/"; // has a trailing slash

			if ( this.resources.hasCommand( commandPath ) ){
				callback( null, this.resources.getCommand( commandPath ) );
			}
			else {
				callback();
			}
		}
	} )
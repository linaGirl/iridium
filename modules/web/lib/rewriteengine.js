


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

		// set object property
		, setProperty: function( key, value ){
			this[ key ] = value;
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
			var reg = /^\/([a-z]{2}\/)?([^0-9][^\/]+)?\/?([a-z][^\/]+)?\/?(.+)?\/?$/gi.exec( request.pathname ), path = "/";
			
			if ( reg ){
				if ( reg[ 2 ] ) path += reg[ 2 ] + "/";
				if ( reg[ 3 ] ) path += reg[ 3 ] + "/";

				if ( this.resources.hasCommand( path ) ){
					if ( reg[ 4 ] ){
						if ( !/[^0-9]/g.test( reg[ 4 ] ) ) request.query.page = parseInt( reg[ 4 ], 10 );
						else request.query.parameters = reg[ 4 ].split( "/" ).filter( function( x ){ return !!x; } );
					} else request.query.page = 1;

					callback( null, this.resources.getCommand( path ) );
				}
				else callback();
			}
			else callback();
		}
	} )
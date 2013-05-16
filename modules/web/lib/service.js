


	// iridium modules
	var   Class 			= iridium( "class" )
		, Events 			= iridium( "events" )
		, log 				= iridium( "log" )
		, db 				= iridium( "db" )
		, util 				= iridium( "util" )
		, argv 				= util.argv
		, Sequence 			= util.Sequence
		, debug 			= argv.has( "trace-all" ) || argv.has( "trace-webservice" );



	// server components
	var   WebServer			= require( "./server" )
	 	, WebFiles 			= require( "./files" )
	 	, SchemaManager		= require( "./schemamanager" )
	 	, ControllerManager	= require( "./controllermanager" )
	 	, SessionManager	= require( "./worker/sessionmanager" )
	 	, ResourceLoader	= require( "./resourceloader" )
		, RewriteEngine 	= require( "./rewriteengine" )
		, RESTManager 		= require( "./restmanager" );



	module.exports = new Class( {
		inherits: Events


		, init: function( options ){
			this.__options = options.options;

			// sequential component loading
			var sequence = new Sequence();
			sequence.add( this.__loadSchemas.bind( this ) );
			sequence.add( this.__cacheResources.bind( this ) );
			sequence.add( this.__loadFiles.bind( this ) );
			sequence.add( this.__loadSessions.bind( this ) );
			sequence.add( this.__loadControllers.bind( this ) );
			sequence.add( this.__loadRESTControllers.bind( this ) );
			sequence.add( this.__loadRewriteEngine.bind( this ) );
			sequence.add( this.__loadWebserver.bind( this ) );

			// start loading ...
			sequence.start( function(){
				log.highlight( "iridium webservice worker is online ....", this );
				this.emit( "load" );
			}.bind( this ) );
		}



		, listen: function( port ){
			this.__server.listen( port );
		}


		, setProperty: function( property, value ){
			this.controllers.setProperty( property, value );
			this.rest.setProperty( property, value );
		}


		// gain acces to the iridium tables
		, __loadSchemas: function( callback ){
			if ( debug ) log.debug( "start loading schemas ...", this );

			this.schemas = new SchemaManager( {
				schema: this.__options.schema
				, on: { load: function(){
					if ( debug ) log.debug( "finished loading schemas ...", this );
					callback();
				}.bind( this ) }
			} );
		}

		// load data from db into cache
		, __cacheResources: function( callback ){
			if ( debug ) log.debug( "start caching resources ...", this );

			this.resources = new ResourceLoader( {
				schema: 		this.schemas.getSchema( "iridium" )
				, languages: 	this.__options.languages
				, sql: 			this.__options.sql
				, on: { load: function(){
					if ( debug ) log.debug( "finished caching resources ...", this );
					callback();
				}.bind( this ) }
			} );
		}

		// load files form disk, compile som edata from db into it
		, __loadFiles: function( callback ){
			if ( debug ) log.debug( "start loading files from webroot ...", this );

			this.files = new WebFiles( {
				path: 			this.__options.webroot
				, lang: {
					languages: 	this.__options.languages
					, locale: 	this.resources.getLocales()
				}
				, navigation: 	this.resources.getNavigations()
				, constants: 	this.__options.constants
				, on: { load: function(){
					if ( debug ) log.debug( "finished loading files from webroot ...", this );
					callback();
				}.bind( this ) }
			} );
		}


		// the session manager
		, __loadSessions: function( callback ){
			if ( debug ) log.debug( "start loading sessionmanager ...", this );
			this.sessions = new SessionManager( {
				schemas: 		this.schemas
				, on: { load: function(){
					if ( debug ) log.debug( "finished loading sessionmanager ...", this );
					callback();
				}.bind( this ) }
			} );
		}


		// load controllers
		, __loadControllers: function( callback ){
			if ( debug ) log.debug( "start loading controllers ...", this );

			this.controllers = new ControllerManager( {
				path: 			this.__options.controllers
				, schemas: 		this.schemas
				, resources: 	this.resources
				, files: 		this.files
				, sessions: 	this.sessions
				, on: { load: function(){
					if ( debug ) log.debug( "finished loading controllers ...", this );
					callback();
				}.bind( this ) }
			} );
		}


		// load rest controllers
		, __loadRESTControllers: function( callback ){
			if ( debug ) log.debug( "start loading REST controllers ...", this );

			this.rest = new RESTManager( {
				  path: 		this.__options.rest
				, schemas: 		this.schemas
				, resources: 	this.resources
				, files: 		this.files
				, sessions: 	this.sessions
				, on: { load: function(){
					if ( debug ) log.debug( "finished loading REST controllers ...", this );
					callback();
				}.bind( this ) }
			} );
		}



		// load rewrite engine, either the one the user delivered, or the integrated one
		, __loadRewriteEngine: function( callback ){
			if ( debug ) log.debug( "starting rewrite engine ...", this );

			var options = {
				  schemas: 		this.schemas
				, resources: 	this.resources
				, sessions: 	this.sessions
				, on: { load: function(){
					if ( debug ) log.debug( "rewrite engine started ...", this );
					callback();
				}.bind( this ) }
			};


			if ( this.__options.rewriteEngine ){
				this.rewriteEngine = new this.__options.rewriteEngine( options );
			}
			else {
				this.rewriteEngine = new RewriteEngine( options );
			}
		}


		// load webserver
		, __loadWebserver: function( callback ){
			if ( debug ) log.debug( "start loading WebServer ...", this );
			
			this.server = new WebServer( {
				port: 				this.__options.port || 80
				, rewriteEngine: 	this.rewriteEngine
				, controllers: 		this.controllers
				, rest: 			this.rest
				, sessions: 		this.sessions
				, resources: 		this.resources
				, on: { 
					load: function(){
						if ( debug ) log.debug( "finished loading WebServer ...", this );
						callback();
					}.bind( this ) 
					, listening: function(){
						this.emit( "listening" );
					}.bind( this )
				}
			} );
		}
	} );
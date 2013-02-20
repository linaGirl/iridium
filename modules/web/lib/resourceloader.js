


	var Class 		= iridium( "class" )
		, Events 	= iridium( "events" )
		, log 		= iridium( "log" )
		, util 		= iridium( "util" )
		, Sequence	= util.Sequence
		, Pool 		= util.Pool
		, debug 	= util.argv.has( "trace-all" ) || util.argv.has( "trace-webservice" );



	var hogan		= require( "../dep/hogan.js/lib/hogan.js" );

	var fs 			= require( "fs" );



	module.exports = new Class( {
		inherits: Events


		, __commands: {}
		, __locale: {}
		, __user: {}
		, __sql: {}


		, defaultLanguage: "en"


		, init: function( options ){
			if ( !options.schema ) throw new Error( "cannot laod resources because the schema is missing!" );
			this.__schema 		= options.schema;
			this.__languages 	= options.languages;
			this.__sqlfiles 	= options.sql;

			var sequence = new Sequence();
			sequence.add( this.__loadRules.bind( this ) );
			sequence.add( this.__loadLocale.bind( this ) );
			sequence.add( this.__loadSql.bind( this ));

			sequence.start( function(){
				this.emit( "load" );
			}.bind( this ) );
		}


		, hasSql: function( id ){
			return this.__sql.hasOwnProperty( id );
		}

		, getSql: function( id ){
			return this.__sql[ id ] || null;
		}

		, renderSql: function( id, data ){
			if ( this.hasSql( id ) ){
				return this.getSql( id ).render( data );
			}
			return null;
		}

		, setResource: function( key, value ){
			this.__user[ key ] = value;
		}

		, hasResource: function( key ){
			return this.__user.hasOwnProperty( key );
		}

		, getResource: function( key ){
			return this.__user[ key ] || null;
		}


		, hasCommand: function( path ){
			return this.__commands.hasOwnProperty( path.toLowerCase()  );
		}

		, getCommand: function( path ){
			return this.__clone( this.__commands[ path.toLowerCase() ] || null );
		}

		, getCommands: function(){
			return this.__commands;
		}

		, getCommandById: function( id ){
			if ( this.hasNavigation( "en", id ) ){
				if ( this.hasCommand( this.getNavigation( "en", id ) ) ){
					return this.getCommand( this.getNavigation( "en", id ) );
				}
			}
			return null;
		}


		, hasNavigation: function( lang, id ){
			return this.__navigation.hasOwnProperty( lang ) && this.__navigation[ lang ].hasOwnProperty( id ) ;
		}

		, getNavigation: function( lang, id ){
			return this.__navigation[ lang ] && this.__navigation[ lang ][ id ] ? this.__navigation[ lang ][ id ] : null;
		}

		, getNavigations: function(){
			return this.__navigation;
		}


		, hasLocale: function( lang, id ){
			return this.__locale.hasOwnProperty( lang ) && this.__locale[ lang ].hasOwnProperty( id ) ;
		}

		, getLocale: function( lang, id ){
			return this.__locale[ lang ] && this.__locale[ lang ][ id ] ? this.__locale[ lang ][ id ] : null;
		}

		// localizetion support
		, getText: function( id, language, data ){
			var text = this.getLocale( language, id ), keys, k;
			if ( !text ) text = this.getLocale( "en", id );
			if ( !text ) text = this.getLocale( "de", id );

			if ( data && text ){
				var keys = Object.keys( data ), k;
				while( k-- ) text = text.replace( new RegExp( "\\{\\{" + keys [ k ] + "\\}\\}", "gi" ), data[ keys [ k ] ] );
			}
			return text;
		}


		, renderLocale: function( lang, id, data ){
			return this.hasLocale( lang, id ) ? hogan.compile( this.getLocale( lang, id ) ).render( data ) : null;
		}

		, getLocales: function(){
			return this.__locale;
		}

		, getLanguages: function(){
			return this.__languages;
		}

		, supportsLanguage: function( language ){
			return this.__languages.indexOf( language ) >= 0;
		}




		// rewrite rules
		, __loadRules: function( callback ){
			this.__schema.query( "SELECT *, rewrite.id as id_rule, controller.name as controllername, action.name as actionname \
								  FROM rewrite  \
								  LEFT JOIN action 		ON action.id = rewrite.id_action \
								  LEFT JOIN controller 	ON controller.id = action.id_controller \
								  ORDER BY rewrite.id_parent;", function( err, rules ){
				if ( err ) throw new Error( "failed to load rules: " + err );
				else if ( rules ){
					var x = rules.length, rule, parents = {}, path, item, m, paths;
					this.__commands = {};
					this.__navigation = {};


					// build path for every language for a given rule ( the path that can be called from the browser )
					var getWebPath = function( rule ){
						var m = this.__languages.length, path = {};

						if ( rule.id_parent ){
							path = getWebPath( parents[ rule.id_parent ] );
							while( m-- ) path[ this.__languages[ m ] ] += rule[ this.__languages[ m ] ] + ( rule[ this.__languages[ m ] ] === "" ? "" : "/" );
						}
						else {
							while( m-- ) path[ this.__languages[ m ] ] = "/" + rule[ this.__languages[ m ] ] + ( rule[ this.__languages[ m ] ] === "" ? "" : "/" );
						}
						return path;
					}.bind( this );

					// get navigation levels
					var getPage = function( rule, obj ){
						var item = {};
						item[ rule.page ] = obj || { $index: true };
						if ( rule.id_parent ) item = getPage( parents[ rule.id_parent ], item );
						return item;
					}.bind( this );			
					

					// get id 
					var getId = function( rule ){
						var item = rule.page;
						if ( rule.id_parent ) item = getId( parents[ rule.id_parent ] ) + "." + item;
						return item;
					}


					while( x-- ){
						rule = rules[ rules.length - 1 - x ];

						// set parentrule
						parents[ rule.id_rule ] = rule;

						// get path
						path = getWebPath( rule );


						m = this.__languages.length;
						while( m-- ){
							if ( ! this.__navigation[ this.__languages[ m ] ] ) this.__navigation[ this.__languages[ m ] ] = {};
							this.__navigation[ this.__languages[ m ] ][ "page." + getId( rule ) ] = path[ this.__languages[ m ] ];
						}
						

						// store only urls linked to an api
						if ( rule.controllername && rule.actionname ){
							m = this.__languages.length;

							item = {
								  controller: 	rule.controllername
								, action: 		rule.actionname
								, data: 		{
									page: 		getPage( rule )
								}
								, query: 		{}
								, path: 		{}
							};

							paths = [];
							while( m-- ){
								item.path[ this.__languages[ m ] ] = path[ this.__languages[ m ] ];
								this.__commands[ path[ this.__languages[ m ] ].toLowerCase() ] = item;
								paths.push( path[ this.__languages[ m ] ] );
							}
							item.reg = paths.join( "|" ).replace( /\//gi, "\\/" );
						}
					}
				}

				//if ( debug ) log.dir( this.__commands, this.__navigation );

				if ( debug ) log.info( "[ " + Object.keys( this.__commands ).length + " ] rules loaded ...", this );
				callback();
			}.bind( this ) );
		}
		



		// load locale data
		, __loadLocale: function( callback ){
			this.__locale = {};


			var replaceNavigationTags = function( locale, lang ){
				var reg = /@navigation\s*\(\s*([^\)]+)\s*\)\s*;/gi, result;

				while ( result = reg.exec( locale ) ){
					if ( this.__navigation[ lang ][ result[ 1 ] ] !== undefined ){
						locale = locale.replace( new RegExp( "@navigation\\s*\\(\\s*" + result[ 1 ] + "\\s*\\)\\s*;", "gi" ), "/" + lang + this.__navigation[ lang ][ result[ 1 ] ] );
					}
					else{
						locale = locale.replace( new RegExp( "@navigation\\s*\\(\\s*" + result[ 1 ] + "\\s*\\)\\s*;", "gi" ), "navigation:" + result[ 1 ] );
						log.warn( "missing navigation locale [" + result[ 1 ] + "] used in locale [" + keys[ i ] + "] for language [" + lang + "] ...", this );
					}
				}

				return locale;
			}.bind( this );



			this.__schema.query( "SELECT * FROM locale;", function( err, result ){
				if ( err ) throw new Error( "failed to load locale: " + err );
				else {
					var m = this.__languages.length;

					while( m-- ) this.__locale[ this.__languages[ m ] ] = {};

					if ( result ){
						var i = result.length;
						while( i-- ){
							m = this.__languages.length;
							while( m-- ){
								this.__locale[ this.__languages[ m ] ][ result[ i ].id ] = replaceNavigationTags( result[ i ][ this.__languages[ m ] ], this.__languages[ m ] );
							}
						}
					}
				}

				callback();
			}.bind( this ) );
		}



		, __loadSql: function( callback ){
			var sqlDir = this.__sqlfiles;

			if ( sqlDir ){
				var pool = new Pool();

				fs.readdir( iridium.app.root + sqlDir, function( err, files ){
					if ( err ) throw new Error( "failed to load sql: " + err );
					else {
						var i = files.length;
						while( i-- ){

							if ( files[ i ].substr( files[ i ].length - 4 ) === ".sql" ){
								( function( file ){
									
									pool.add( function( cb ){
										fs.readFile( iridium.app.root + sqlDir + "/" + file, function( err, data ){
											if ( err ) throw new Error( "failed to load file [" + iridium.app.root + sqlDir + "/" + file + "]: " + err );
											else {
												this.__sql[ file.substr( 0, file.length - 4 ) ] = hogan.compile ( data.toString( "utf-8" ) );
											}
											cb();
										}.bind( this ) );
									}.bind( this ) );
								}.bind( this ) )( files[ i ] );
							}
						}
					}
					pool.start( callback );
				}.bind( this ) );
			}
			else {
				callback();
			}
		}


		, __clone: function( input ){
			var result, i, keys;

			switch ( typeof input ){
				case "object":
					if ( Array.isArray( input ) ){
						result = input.length > 0 ? input.slice( 0 ) : [];
						i = result.length;
						while( i-- ) result[ i ] = this.__clone( result[ i ] );
					}
					else if ( Buffer.isBuffer( input ) ){
						result = new Buffer( input.length );
						input.copy( result );
					}
					else if ( input === null ){
						return null;
					}
					else if ( input instanceof RegExp ){
						return input;
					}
					else {
						result = {};
						keys = Object.keys( input );
						i = keys.length;
						while( i-- ) result[ keys[ i ] ] = this.__clone( input[ keys[ i ] ] );
					}
					break;

				default:
					return input;
			}

			return result;
		}
	} );
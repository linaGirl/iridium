


	var Class 			= iridium( "class" )
		, Events 		= iridium( "events" )
		, log 			= iridium( "log" )
		, Schema 		= iridium( "db" ).Schema;


	var fs 				= require( "fs" );





	module.exports = new Class( {
		inherits: Events


		, __schemas: {}


		, init: function( options ){
			this.__config = options.schema;
			this.__loadSchemas();
		}



		, getSchema: function( schema ){
			return this.__schemas[ schema ] || null ;
		}

		, getModel: function( model ){
			return this.__schemas[ schema ] && this.__schemas[ schema ][ model ] ? this.__schemas[ schema ][ model ] : null ;
		}



		, __loadSchemas: function(){
			var keys = Object.keys( this.__config )
				, i = keys.length
				, loaded = 0
				, count = 1,
				 onLoad = function(){
					loaded++;
					if ( loaded === count ){
						this.emit( "load" );
					}
				}.bind( this );


			while( i-- ){
				count++;

				( function( schemaName ){
					// lthe irdium schema has its own models
					if ( schemaName === "iridium" ) this.__config[ schemaName ].path = iridium.root + "iridium/modules/web/lib/schema";
					else this.__config[ schemaName ].path = iridium.app.root + this.__config[ keys[ i ] ].path;

					
					this.__schemas[ schemaName ] = new Schema( {
						config: this.__config[ schemaName ]
						, name: schemaName
						, on: {	load: onLoad }
					} );

					this.__defineGetter__( schemaName, function(){ return this.__schemas[ schemaName ]; }.bind( this ) );
					this.__defineSetter__( schemaName, function(){ throw new Error( "you cannot overwrite the schema [" + schemaName + "]!" ) }.bind( this ) );
				}.bind( this ) )( keys[ i ] );				
			}

			onLoad();
		}
	} );
	"use strict";


	var   string 	= require( "../../util/lib/string" )
		, Obj 		= require( "../../util/lib/object" )
		, Class 	= require( "./class" )
		, nolog 	= process.argv.indexOf( "--nolog" ) > -1;

	var util 		= require( "util" );


	
	module.exports = new ( new Class( {

		__config: {
			  debug: 		string.grey
			, info: 		string.white
			, warn: 		string.yellow.concat( string.bold )
			, error: 		string.red.concat( string.bold )
			, highlight: 	string.cyan.concat( string.bold )
		}


		, init: function(){
			Obj.forEach( this.__config, function( key, value ){
				this[ key ] = function(){
					if ( nolog ) return;
					this.__log( key, value, Array.prototype.slice.call( arguments, 0 ) );
				}.bind( this );
			}.bind( this ) );
		}

		

		, trace: function( err, source ){
			var signature = source && source.$id ? source.$id : "" ;			
			if ( nolog ) return;
			
			if ( err && err.stack ){
				console.log( string.style( string.pad( "", 80, "#" ), string.grey ) );
				console.log( 
					string.style( "\n" + signature + ": ", string.grey ) 
					+ string.style( err.name === "AssertionError" ? 
						( "AssertionError: <" + err.actual + "> " + err.operator + " <" + err.expected + ">" ) 
						: ( err.message ? err.message : "-" ), string.white ) 
					+ "\n" );
			
				// the stacktrace
				err.stack.split( "\n" ).forEach( function( line ){
					var reg = /at (.*) \((.*)\:([0-9]+)\:([0-9]+)\)$/.exec( line ) || /at ()(.*)\:([0-9]+)\:([0-9]+)$/.exec( line );

					if ( reg ){
						console.log( 
							  string.style( string.pad( reg[ 2 ], 42, " " ), string.yellow ) 
							+ string.style( string.pad( reg[ 3 ],  5, " " ), string.white ) 
							+ string.style( ":", string.grey ) 
							+ string.style( string.pad( reg[ 4 ],  4, " ", true ), string.grey ) 
							+ string.style( reg[ 1 ], string.white ) 
						);
					}
				}.bind( this ) );

				console.log( string.style( "\n" + string.pad( "", 80, "#" ), string.grey ) );
			}
		}


		, __log: function( mode, styles, items ){
			var signature = "", now = new Date();

			// extract signature, remove items whic are class instances
			items = items.filter( function( item ){
				if ( item.$id ) {
					signature = item.$id;
					return false;
				}
				return true;
			} );

			// log
			items.forEach( function( item ){
				if ( typeof item === "object" ) this.dir( item );
				else console.log( string.style( 
							string.pad( now.getDate(), 2, "0" )
					+ " " + string.pad( now.getHours(), 2, "0" ) 
					+ ":" + string.pad( now.getMinutes(), 2, "0" ) 
					+ ":" + string.pad( now.getSeconds(), 2, "0" ) 
					+ "." + string.pad( now.getMilliseconds(), 3, "0", true ) 
					+ " " + string.pad( signature, 40 ) + " >>> ", string.grey )
					+ string.style( item, styles )
				);
			}.bind( this ) );
		}



		, dir: function( item ){
			console.log( util.inspect( item, false, 0, true ) );
		}
	} ) )();
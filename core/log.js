	


	var Class = require( "./class" )
		, prototype = require( "./prototype" );








	// the logger is a singleton
	module.exports = log = new ( new Class( {
		$id: "log"

		// debug
		, debug: function(){
			var logs = this.__extractMessage( Array.prototype.slice.call( arguments ) );
			console.log( this.__createSignature( logs.source ) + logs.text.grey );

			for ( var i = 0, l = logs.dir.length; i < l; i++ ){
				this.dir( logs.dir[ i ] );
			}
		}

		// info
		, info: function( message, source ){
			var logs = this.__extractMessage( Array.prototype.slice.call( arguments ) );
			console.log( this.__createSignature( logs.source ) + logs.text.white );

			for ( var i = 0, l = logs.dir.length; i < l; i++ ){
				this.dir( logs.dir[ i ] );
			}
		}

		// warn
		, warn: function( message, source ){
			var logs = this.__extractMessage( Array.prototype.slice.call( arguments ) );
			console.log( this.__createSignature( logs.source ) + logs.text.yellow.bold );

			for ( var i = 0, l = logs.dir.length; i < l; i++ ){
				this.dir( logs.dir[ i ] );
			}
		}

		// error ( uncatchable )
		, error: function( message, source ){
			var logs = this.__extractMessage( Array.prototype.slice.call( arguments ) );
			console.log( this.__createSignature( logs.source ) + logs.text.red.bold );

			for ( var i = 0, l = logs.dir.length; i < l; i++ ){
				this.dir( logs.dir[ i ] );
			}
		}



		// highlight a message
		, highlight: function( message, source ){
			var logs = this.__extractMessage( Array.prototype.slice.call( arguments ) );
			console.log( this.__createSignature( logs.source ) + logs.text.white.bold );

			for ( var i = 0, l = logs.dir.length; i < l; i++ ){
				this.dir( logs.dir[ i ] );
			}
		}




		// extract message
		, __extractMessage: function( items ){
			var result = { text: "", dir: [] }, current;

			for ( var i = 0, l = items.length; i < l; i++ ){
				current = items[ i ];

				switch ( typeof current ){
					case "object":
						if ( current === null ){
							result.text += "null "
						}
						else if ( Buffer.isBuffer( current ) ){
							for ( var k = 0, m = current.length; k < m; k++ ){
								result.text += current[ k ].toString( 16 ) + " ";
								if ( k > 400 ) {
									result.text += "[ ... ] "
									break;
								}
							}
						}
						else {
							if ( current.$id ){
								result.source = current;
							}
							else {
								result.dir.push( current );
							}
						}
						break;

					case "string":
						if ( current.length > 1000 ){
							result.text +=  current.substr( 0, 1000 ) + " [ ... ] ";
						}
						else {
							result.text +=  current + " ";
						}
						break;

					default:
						result.text +=  current + " ";
				}
			}
			return result;
		}



		// dir an object displaying an optional message
		, dir: function(){
			var items = Array.prototype.slice.call( arguments );

			for ( var i = 0, l = items.length; i < l; i++ ){
				this.__dir( items[ i ], 0, null, true, [] );
			}
		}




		// private dir
		, __dir: function( data, margin, name, first, knownObjects  ){
			name = ( typeof name === "string" ? name + ": " : "" ).white;

			switch ( typeof data ){
				case "object":
					if ( data === null ){
						console.log( this.__pad( "", margin * 4, " " ) + ( ! first ? ", " : "" ).grey + name + "null".white );
					}
					else if ( Buffer.isBuffer( data ) ){
						var result =  this.__pad( "", margin * 4, " " ) + ( ! first ? ", " : "" ).grey + name;

						for ( var i = 0, l = data.length; i < l; i++ ){
							if ( i > 66 ){
								result += "... ( omitted ".grey + ( ( data.length - 66 ) + "" ).grey + " )".grey
								break;
							}
							else {
								result += ( data[ i ].toString( 16 ) + " " ).white;
							}
						}
						console.log( result );
					}
					else {
						if ( knownObjects.indexOf( data ) >= 0 ){
							return console.log( this.__pad( "", margin * 4, " " ) + ( ! first ? ", " : "" ).grey + name + "[ circular ]".grey );
						}
						else {
							knownObjects.push( data );
						}
						var keys = Object.keys( data ), i = keys.length, l = i, k = 0
							, isArray = Object.prototype.hasOwnProperty.call( data, "length" );

						if ( margin > 20 ) return console.log( this.__pad( "", margin * 4, " " ) + ( ! first ? ", " : "" ).grey + name + ": ".grey + ( isArray ? "[ ... ]" : "{ ... }" ).grey + " // max inspection depth reached".grey );

						if ( i === 0 ){
							return console.log( this.__pad( "", margin * 4, " " ) + ( ! first ? ", " : "" ).grey + name + ( isArray ? "[]" : "{}" ).grey );
						}

						console.log( this.__pad( "", margin * 4, " " ) + ( ! first ? ", " : "" ).grey + name + ( isArray ? "[" : "{" ).grey );
						first = true;
						while( i-- ){
							if ( k > 50 ) {
								console.log( this.__pad( "", ( margin + 1 ) * 4, " " ) + ", ".grey + ( isArray ? "" : name ) + "... ( omitted ".grey + ( i + 1 + "" ).grey + " ) // max items per object reached".grey );
								console.log( this.__pad( "", margin * 4, " " ) + ( isArray ? "]" : "}" ).grey );
								return;
							}

							this.__dir( data[ keys[ l - i - 1  ] ], margin + 1, ( isArray ? null : keys[ l - i - 1  ] ), first, knownObjects );
							if ( first ) first = false;
							k++
						}
						console.log( this.__pad( "", margin * 4, " " ) + ( isArray ? "]" : "}" ).grey );
					}
					break;

				case "string":
					if ( data.length > 200 ){
						console.log( this.__pad( "", margin * 4, " " ) + ( ! first ? ", " : "" ).grey + name + "\"".white + data.substr( 0, 200 ).green + "...\"".white + " ( omitted ".grey + ( data.length - 200 + "" ).grey + " )".grey);
					}
					else {
						console.log( this.__pad( "", margin * 4, " " ) + ( ! first ? ", " : "" ).grey + name + "\"".white + data.green + "\"".white );
					}
					break;

				case "number":
					console.log( this.__pad( "", margin * 4, " " ) + ( ! first ? ", " : "" ).grey + name + ( data + "" ).blue.bold );
					break;

				case "boolean":
					console.log( this.__pad( "", margin * 4, " " ) + ( ! first ? ", " : "" ).grey + name + data.toString().yellow );
					break;

				case "function":
					console.log( this.__pad( "", margin * 4, " " ) + ( ! first ? ", " : "" ).grey + name + data.toString().substr( 0, 100 ).replace( /\n|\t|\s{2,}/gi, " " ).grey );
					break;

				default:
					console.log( this.__pad( "", margin * 4, " " ) + ( ! first ? ", " : "" ).grey + name + data );
					break;

			}
		}



		// trace an error displaying an optional message
		, trace: function( err, source ){
			var lines, current, i, l;
			if ( err && err.stack ){

				console.log( this.__pad( "", 80, "#" ).grey );
				console.log( "\n" + ( source && source.$id ? source.$id + ": " : "Error: " ).grey + ( err.message ? err.message : "-" ).white + "\n" );

				lines = err.stack.split( "\n" );
				i = lines.length, l = i;

				while( i-- ){
					current = /at (.*) \((.*)\:([0-9]+)\:([0-9]+)\)$/.exec( lines[ l - i ] );
					
					if ( ! current ){
						current = /at ()(.*)\:([0-9]+)\:([0-9]+)$/.exec( lines[ l - i ] );
					}
					if ( current ) {
						console.log( this.__pad( current[ 2 ], 42, " " ).yellow + this.__pad( current[ 3 ], 5, " " ).white + ":".grey + this.__pad( current[ 4 ], 4, " ", true ).grey + current[ 1 ].white  );
					}
				}

				console.log( "\n" + this.__pad( "", 80, "#" ).grey );
			}
		}



		// create logsignature
		, __createSignature: function( source ){
			var sourceName = ( source && source.$id ), date = new Date(), result;

			result  = this.__pad( date.getDate(), 2 ) + " ";
			result += this.__pad( date.getHours(), 2 ) + ":";
			result += this.__pad( date.getMinutes(), 2 ) + ":";
			result += this.__pad( date.getSeconds(), 2 ) + ".";
			result += this.__pad( date.getMilliseconds(), 3 );

			result += " > "
			result += this.__pad( ( source && source.$id ) || "-", 20, " " );
			result += " >>> "

			return result.grey;
		}



		// pad
		, __pad: function( text, len, char, invert ){
			text = text + "";
			return text.length >= len ? text : ( invert ? text + new Array( len - text.length + 1).join( char || "0" ) : new Array( len - text.length + 1).join( char || "0" ) + text );			
		}
	} ) )();
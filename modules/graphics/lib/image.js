



	var Class 				= iridium( "class" )
		, Events			= iridium( "events" )
		, log 				= iridium( "log" )
		, util 				= iridium( "util" )
		, ReadableStream 	= util.ReadableStream
		, WritableStream 	= util.WritableStream;


	var gm 					= require( "../node_modules/gm" );






	module.exports = new Class( {
		inherits: Events


		, init: function( options ){
			this.data = options.data;
			this.__gm = gm( new ReadableStream( options ) );
		}


		, getSize: function( callback ){
			if ( !callback ) throw new Error( "missing callback" );
			this.__gm.size( callback );
			return this;
		}


		, smartcrop: function( width, height, mime, callback ){
			if ( isNaN( width ), isNaN( height ) ) callback( new Error( "invalid image resolution!" ) );
			else {
				this.getSize( function( err, size ){
					if ( err ) callback( err );
					else {
						var   hFactor = height / size.height
							, wFactor = width / size.width
							, factor = wFactor > hFactor ? wFactor : hFactor
							, newW = Math.round( size.width * factor )
							, newH = Math.round( size.height * factor )
							, paddingW = Math.round( ( ( newW - width ) / 2 ) * ( newW > width ? 1 : -1 ) )
							, paddingH = Math.round( ( ( newH - height ) / 2 ) * ( newH > height ? 1 : -1 ) );

						

						/*console.log( {
							resize: {
								width: newW
								, height: newH
							}
							, crop: {
								width: width
								, height: height
								, paddingW: paddingW
								, paddingH: paddingH
							}
							, size: size
						} );*/

						this.__gm.resize( newW, newH );
						this.__gm.crop( Math.round( width ), Math.round( height ), paddingW, paddingH );
						this.toBuffer( mime, function( err, imagedata ){
							//console.log( err, imagedata, size );
							callback( err, imagedata );
						}.bind( this ) );
					}
				}.bind( this ) );
			}
			
			return this;
		}


		, quality: function( val ){
			this.__gm.quality( 80 );
			return this;
		}


		, toBuffer: function( mimeType, callback ){
			var type = "png";

			switch( mimeType ){
				case "image/jpg":
				case "image/jpeg":
					type = "jpg";
			}

			this.__gm.stream( type, function( err, stdout, stderr ){
				if ( err ) callback( err );
				else {
					new WritableStream().pipe( stdout ).on( "end", function( data ){
						callback( null, data );
					}.bind( this ) );

					new WritableStream().pipe( stderr ).on( "end", function( data ){
						if ( data ) console.log( data.toString() );
					}.bind( this ) );
				}
			}.bind( this ) );
			return this;
		}
	} );
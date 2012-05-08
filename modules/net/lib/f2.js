

	// F2 BINARY PROTOCOL

	module.exports = {
		  ReadStream: function(){ throw new Errro( "not implemented yet!" ); } // require( "./f2readstream" )
		, WriteStream: function(){ throw new Errro( "not implemented yet!" ); } // require( "./f2writestream" )
		, Reader: require( "./f2reader" )
		, Writer: require( "./f2writer" )
	};
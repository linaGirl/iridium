	
	require( "./" )( "iridium test", 1 );


	var memfs = new iridium( "fs" ).MemoryFS( {
		path: "/srv/cubemedia/tools/apiExplorer/www"
		, on: {
			change: function( evt, path ){
				console.log( evt, path );
			}
		}
	} );
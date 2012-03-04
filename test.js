
	require( "./" )( "iridium test", 1 );

	var Net = iridium( "net" );


	new Net( {
		credentials: {
			one: {}
		}
		, listen: [
			{
				port: 7897
				, secure: true
				, verify: "one"
				, credentials: "one"
				, bind: []
			}
		]
	} );
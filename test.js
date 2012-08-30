	
	require( "./" )( "iridium test", 1 );


	var MySQLPool = iridium( "db" ).MySQLPool;
	var log = iridium( "log" );


	var pool = new MySQLPool( {
		configs: [
			{
				  host: 	"62.2.201.51"
				, port: 	13306
				, user: 	"api"
				, password: "api4cinergy"
				, database:	"session"
				, weight: 	10
				, writeable: true
			}
		]
	} );
	var id = "01069d81e879dea52f58dce3119cf09d234a1a2dbb37f9a0168a97a44ecbc3ebb066b36821407a5b200432b00420e7cbfe9de5e6cefe5a1f6c31d381cf38aeb7";
	pool.createTransaction( function( transaction ){
		transaction.query( "DELETE FROM session WHERE id = ?;", [ id ], function( err, result ){
			log.dir( err, result );
			transaction.commit( function( err, result ){
				log.dir( err, result );
			});
		} );
	} );

	pool.query( "SELECT * FROM session WHERE id = ?;", [ id ], function( err, result ){
		log.dir( err, result );
	} );

	//var net = iridium( "net" );


	//new net.TCPServer();


	// var memfs = new iridium( "fs" ).MemoryFS( {
	// 	path: "/srv/cubemedia/tools/apiExplorer/www"
	// 	, on: {
	// 		change: function( evt, path ){
	// 			console.log( evt, path );
	// 		}
	// 	}
	// } );
	

	module.exports = {
			
			// you may only use the webfiles
		    Files: 				require( "./lib/files" )

		    // you may extend the rewrite engine used for the webservice
		  , RewriteEngine: 		require( "./lib/rewriteengine" )

		    // you may start a clustered webservice based on mysql, models & controllers
		  , WebService: 		require( "./lib/index" )

		    // extend the defult controllers
		  , Controller: 		require( "./lib/controller" )

		  	// rest collection crontroller
		  ,	RestController: 	require( "./lib/restcontroller" )
		   
		    // extend the defult controllers
		  , Cookie: 			require( "./lib/cookie" )

		  	// hogan compiler
		  , hogan: 				require( "./dep/hogan.js/lib/hogan.js" )

		  // form parsing
		  , formidable: 		require( "./node_modules/formidable" )
	};
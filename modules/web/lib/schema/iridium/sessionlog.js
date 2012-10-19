


	var Class 			= iridium( "class" )
		, log 			= iridium( "log" )
		, Model 		= iridium( "db" ).Model; 


	module.exports = new Class( {
		inherits: Model

		, __properties: {
			  id: 				Model.PRIMARY
			, id_session: 		null
			, accessed: 		null
			, ip: 				null
			, useragent: 		null
		}
	} );



	var Class 			= iridium( "class" )
		, log 			= iridium( "log" )
		, Model 		= iridium( "db" ).Model; 


	module.exports = new Class( {
		inherits: Model

		, __properties: {
			  id_session: 		Model.PRIMARY
			, id_user: 			Model.PRIMARY
			, authenticated:	null
			, active: 			null
		}
	} );
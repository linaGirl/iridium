


	var Class 			= iridium( "class" )
		, log 			= iridium( "log" )
		, Model 		= iridium( "db" ).Model; 


	module.exports = new Class( {
		inherits: Model

		, __properties: {
			  id: 				Model.PRIMARY
			, userId: 			null
			, lastHit: 			null
			, authenticated: 	null
		}


		// data that isnt persistet
		, data: {}


		, toJSON: function(){
			var data = ( this.__proto__.__proto__.__proto__ && this.__proto__.__proto__.__proto__.toJSON ) ? this.__proto__.__proto__.__proto__.toJSON.call( this ) : this.__proto__.__proto__.toJSON.call( this );
			data.data = this.data;
			return data;
		}
	} );
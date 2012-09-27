


	var Class 			= iridium( "class" )
		, Events 		= iridium( "events" )
		, log 			= iridium( "log" );





	module.exports = new Class( {
		$id: "web.rewriteengine"
		, inherits: Events


		, __rules: {}
		, __ruleCount: 0




		, addRule: function( id, fn ){
			this.__ruleCount = this.__rules.length;
		}



		, rewrite: function( uri, headers ){
			var i = this.__ruleCount, result;


			while( i-- ){
				if ( result = this.__rules[ this.__ruleCount - 1 - i ](  uri, session ) ){
					return result;
				}
			}

			return null;
		}
	} );
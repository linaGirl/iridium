



	var Class 			= iridium( "class" )
		, Events		= iridium( "events" )
		, log 			= iridium( "log" );


	var imagick 		= require( "../dep/node-imagemagick/imagemagick" );






	module.exports = new Class( {
		$id: "graphics.image"
		, inherits: Events



		, __busy: false
		, __stack: []


		, __data: null



		, init: function( options ){
			if ( options.image ){
				this.__data = options.image;
			}
			else if ( options.path ){
				this.__path = options.path;
				this.__busy = true;
				fs.readFile( options.path, function( err, data ){
					if ( err ){
						this.emit( "error", err );
					}
					else {
						this.__data = data;
						this.__doNext();
					}
				}.bind( ths ) );
			}
		}



		// synchronous, computations are done asynchronous, to get the result you have to call the asynchronous get api
		, resize: function( options ){
			if ( this.__busy ) return this.__stack.push( { fn: "resize", args: arguments } ), this;
			this.__busy = true;

			imagick.

			return this;
		}




		, crop: function( options ){




			return this;
		}




		, identify: function(){

		}



		// get imagedata
		, get: function( callback ){

		}


		


		// if there are buffered calls, execute them
		, __doNext: function(){
			if ( this.__stack.length > 0 ){
				var item = this.__stack.shift();
				this.__busy = false;
				this[ item.fn ].apply( this, Array.prototype.slice.call( item.args, 0 ) );
			}
			else {
				this.__busy = false;
				this.emit( "ready" );
			}
		}
	} );
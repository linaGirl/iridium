



	var Class = iridium( "class" )
		, log = iridium( "log" );



	var instance;


	

	var doGradient = function( input, vendor ){
		log.dir( lexer( input.value ) );
		if ( /(?:^|[^\-])(?:linear|radial)\-gradient/gi.test( input.value ) ){
			
			return input.value;
			//return createVendorString( tokenize( input.value ), vendor );
		}
		return input;
	}



	var createVendorString = function( tokens, vendor ){
		var i, result = "";

		for ( i = 0; i < tokens.length; i++ ){
			if ( typeof tokens[ i ] === "string" ){
				result += tokens[ i ] + " "
			}
			else {
				switch( tokens[ i ].fn ){
					case "linear-gradient":

						break;
					case "radial-gradient":

						break;

					case "rgb":
					case "rgba":
						result += tokens[ i ].fn + "(" + tokens[ i ].tokens.join( ", " ) + ") "
						break;
				}
			}
		}



		log.dir( tokens );
		return result;
	}


var assert = require('assert').ok;
var lexer = function(css) {
  css = css.replace(/\r\n|\r/g, '\n');

  var i = 0
    , l = css.length
    , ch
    , buff = ''
    , key
    , line = 1
    , offset = 0
    , tokens = []
    , stack = [];

  var state = function() {
    return stack[stack.length-1];
  };

  for (; i < l; i++) {
    ch = css[i];
    offset++;

    switch (ch) {
      case '\\':
        buff += ch;
        buff += css[++i];
        break;
      case '\n':
        offset = 0;
        line++;
        ; // FALL-THROUGH
      case '\t':
        switch (state()) {
          case 'single_string':
          case 'double_string':
          case 'comment':
            buff += ch;
            break;
          default:
            break;
        }
        ; // FALL-THROUGH
      case ' ':
        // need this to get at-rule
        // names, store them in `key`
        if (state() === 'at_rule' && !key) {
          key = buff;
          buff = '';
        }
        buff += ch;
        break;
      case '{':
        switch (state()) {
          case 'single_string':
          case 'double_string':
          case 'comment':
            buff += ch;
            break;
          case 'at_rule':
            tokens.push({
              type: 'nested_at',
              name: key,
              params: buff.trim(),
              line: line
            });
            key = '';
            buff = '';
            stack.pop();
            stack.push('inside');
            break;
          case 'value':
            // we were inside a
            // selector instead
            // of a property like
            // we originally thought
            stack.pop();
            buff = key + ':' + buff;
            key = '';
            ; // FALL-THROUGH
          case 'inside':
          default:
            tokens.push({
              type: 'rule',
              selector: buff.trim(),
              line: line
            });
            buff = '';
            stack.push('inside');
            break;
        }
        break;
      case '}':
        switch (state()) {
          case 'value':
            assert(key !== '');
            tokens.push({
              type: 'property',
              key: key.trim(),
              val: buff.trim(),
              line: line
            });
            key = '';
            buff = '';
            stack.pop();
            assert(state() === 'inside');
            ; // FALL-THROUGH
          case 'inside':
            tokens.push({
              type: 'end',
              line: line
            });
            buff = '';
            break;
        }
        switch (state()) {
          case 'single_string':
          case 'double_string':
          case 'comment':
            buff += ch;
            break;
          default:
            stack.pop();
            break;
        }
        break;
      case ':':
        switch (state()) {
          case 'inside':
            // at this point were
            // either inside a selector
            // or a property, we dont
            // really know. well assume
            // its a property for now,
            // and if we hit a curly
            // brace later, we can
            // change the state token
            // to a rule
            key = buff;
            buff = '';
            stack.push('value');
            break;
          default:
            buff += ch;
            break;
        }
        break;
      case ';':
        switch (state()) {
          case 'value':
            // a useless semicolon
            if (!key) break;
            tokens.push({
              type: 'property',
              key: key.trim(),
              val: buff.trim(),
              line: line
            });
            key = '';
            buff = '';
            stack.pop();
            break;
          case 'at_rule':
            tokens.push({
              type: 'at',
              name: key,
              params: buff.trim(),
              line: line
            });
            key = '';
            buff = '';
            stack.pop();
            break;
          default:
            buff += ch;
            break;
        }
        break;
      case '/':
        switch (state()) {
          case 'single_string':
          case 'double_string':
          case 'comment':
            buff += ch;
            break;
          default:
            if (css[i+1] === '*') {
              i++;
              stack.push('comment');
            } else {
              buff += ch;
            }
            break;
        }
        break;
      case '*':
        switch (state()) {
          case 'comment':
            if (css[i+1] === '/') {
              i++;
              tokens.push({
                type: 'comment',
                text: buff,
                line: line
              });
              buff = '';
              stack.pop();
            } else {
              buff += ch;
            }
            break;
          default:
            buff += ch;
            break;
        }
        break;
      case '@':
        switch (state()) {
          case 'single_string':
          case 'double_string':
          case 'comment':
            buff += ch;
            break;
          default:
            assert(buff.trim() === '');
            buff = '';
            buff += ch;
            stack.push('at_rule');
            break;
        }
        break;
      case '"':
        switch (state()) {
          case 'comment':
          case 'single_string':
            break;
          case 'double_string':
            stack.pop();
            break;
          default:
            stack.push('double_string');
            break;
        }
        buff += ch;
        break;
      case '\'':
        switch (state()) {
          case 'comment':
          case 'double_string':
            break;
          case 'single_string':
            stack.pop();
            break;
          default:
            stack.push('single_string');
            break;
        }
        buff += ch;
        break;
      default:
        if (ch < ' ') {
          throw new
            Error('Control character found.'
                  + '\nLine: ' + line
                  + '\nOffset: ' + offset);
        }
        buff += ch;
        break;
    }
  }

  return tokens;
};

	var tokenize = function( input, mode ){
		mode = mode || ",";
		var tokens = [], result, reg = new RegExp( "[\(\) \,\;]", "gi" ), offset = 0, level = 0, current, fn, fnoffset;
		input = input.replace( / *([\( ,]) */gi, "$1" );

		while( result = reg.exec( input ) ){
			switch ( result[ 0 ] ){
				case " ":
				case ",":
				case ";":
					current = input.substring( offset, result.index ).trim();
					if ( current.length > 0 && level === 0 ) tokens.push( current );
					offset = result.index + 1;
					break;

				case "(":					
					if ( level === 0 ) {
						fnoffset = result.index + 1;
						fn = input.substring( offset, result.index ).trim();
					}
					offset = result.index + 1;
					level++;
					break;
				case ")":
					level--;
					if ( level === 0 ){
						tokens.push( {
							fn: fn
							, tokens: tokenize( input.substring( fnoffset, result.index ).trim() )
						} );
					}
					offset = result.index + 1;
					break;
			}
		}

		if ( offset < input.length && level === 0){
			current = input.substring( offset ).trim();
			if ( current.length > 0 ) tokens.push( current );
		}

		return tokens;
	}






	// using a lexer would be nice =P

	var CSSPrefixer = module.exports = new Class( {
		$id: "cssprefixer"




		// renders multiple versions of the css: 
		// debug 	-> add commented prefixed styles, remove autogenerated comments
		// all 		-> render all rules, remove comments
		// moz 		-> render default + moz, remove comments
		// o 		-> render default + o, remove comments
		// ms 		-> render default + ms, remove comments 
		// webkit 	-> render default + webkit, remove comments
		, fix: function( css ){
			var cleanCSS = this.__removeAutoRules( css ).replace( /\;?([\n\t\s]*\})/gi, ";$1" )
				, keys = Object.keys( this.__rules ), i = keys.length
				, items = [];

			// extract statements
			while( i-- ){
				cleanCSS = cleanCSS.replace( new RegExp( "([\t\s\n]+)(" + keys[ i ] + ")[\t\s]*\:([^\;\}]+)\;", "gi" ), function( match, spacing, rule, value ){
					items.push( {
						match: match
						, spacing: spacing.replace( /\n/gi, "" )
						, rule: rule
						, value: value
					} );
					return "\n::replace(" +( items.length - 1 ) + ")::";
				}.bind( this ) );
			}

			return {
				  debug: 	this.__render( cleanCSS, items, "debug" )
				, all: 		this.__render( cleanCSS, items, "all" )
				, moz: 		this.__render( cleanCSS, items, "moz" )
				, o: 		this.__render( cleanCSS, items, "o" )
				, ms: 		this.__render( cleanCSS, items, "ms" )
				, webkit: 	this.__render( cleanCSS, items, "webkit" )
			};
		}




		, __render: function( input, items, target ){
			var css = input, i = items.length, rule, current, lineEnding = target === "debug" ? "; /* compiler-flag: remove */\n" : "; \n";
			var renderTarget = function( rule, item, target ){
				//console.log( rule, typeof rule[ target ], item);
				if ( rule[ target ] ) return item.spacing + "-" + target + "-" + item.rule + ": " + this.__getPadding( 8 - 2 - target.length ) + ( typeof rule[ target ] === "function" ? rule[ target ]( item, target ) : item.value ) + lineEnding;
				return "";
			}.bind( this )

			while( i-- ){
				item = items[ i ];
				rule = this.__rules[ item.rule ];

				// what a fucking hack, where is the lexer ?
				if ( item.value.split( "(" ).length === item.value.split( ")" ).length ){
					// original rule
					current = item.spacing + item.rule + ":         " + item.value + ";\n"

					//render for the different targets
					if ( target === "webkit" || target === "all" || target === "debug" ) 	current += renderTarget( rule, item, "webkit" );
					if ( target === "moz" || target === "all" || target === "debug" ) 		current += renderTarget( rule, item, "moz" );
					if ( target === "ms" || target === "all" || target === "debug" )		current += renderTarget( rule, item, "ms" );
					if ( target === "o" || target === "all" || target === "debug" )			current += renderTarget( rule, item, "o" );

					// insert
					css = css.replace( "::replace(" + i + ")::", current );
				}
				else {
					css = css.replace( "::replace(" + i + ")::", item.spacing + item.rule + ": " + item.value );
				}
			}

			return css;
		}




		, __getPadding: function( targetLength ){
			return new Array( targetLength + 1 ).join( " " );
		}


		// remove comments
		, __removeComments: function( css ){
			return css.replace( /\/\*[\s\S]*?\*\//gi, "" );
		}


		// remove rules inserted by this class
		, __removeAutoRules: function( css ){
			return css.replace( /(?:\n|^)[^\:]+\:[^\;\}]+[\;\}][\t\s]*\/\*[\t\s]*compiler\-flag\:\s*remove[^\*]*\*\/[\t\s]*(?:\n|$)/gi, "\n" );
		}


		// thx @ https://github.com/myfreeweb/cssprefixer/blob/master/cssprefixer/rules.py
		, __rules: {
			  "border-radius": 					{ webkit: true, moz: true, ms: true, o: true }
			, "border-top-left-radius": 		{ webkit: true, moz: true, ms: true, o: true }
			, "border-top-right-radius": 		{ webkit: true, moz: true, ms: true, o: true }
			, "border-bottom-right-radius": 	{ webkit: true, moz: true, ms: true, o: true }
			, "border-bottom-left-radius": 		{ webkit: true, moz: true, ms: true, o: true }

			, "border-image": 					{ webkit: true, moz: true, ms: true, o: true }			
			, "box-shadow": 					{ webkit: true, moz: true, ms: true, o: true }
			, "box-sizing": 					{ webkit: true, moz: true, ms: true, o: true }
			, "box-orient": 					{ webkit: true, moz: true, ms: true, o: true }
			, "box-direction": 					{ webkit: true, moz: true, ms: true, o: true }
			, "box-ordinal-group": 				{ webkit: true, moz: true, ms: true, o: true }
			, "box-align": 						{ webkit: true, moz: true, ms: true, o: true }
			, "box-flex": 						{ webkit: true, moz: true, ms: true, o: true }
			, "box-flex-group": 				{ webkit: true, moz: true, ms: true, o: true }
			, "box-pack": 						{ webkit: true, moz: true, ms: true, o: true }
			, "box-lines": 						{ webkit: true, moz: true, ms: true, o: true }
			, "user-select": 					{ webkit: true, moz: true, ms: true, o: true }
			, "user-modify": 					{ webkit: true, moz: true, ms: true, o: true }
			, "margin-start": 					{ webkit: true, moz: true, ms: true, o: true }
			, "margin-end": 					{ webkit: true, moz: true, ms: true, o: true }
			, "padding-start": 					{ webkit: true, moz: true, ms: true, o: true }
			, "padding-end": 					{ webkit: true, moz: true, ms: true, o: true }
			, "column-count": 					{ webkit: true, moz: true, ms: true, o: true }
			, "column-gap": 					{ webkit: true, moz: true, ms: true, o: true }
			, "column-rule": 					{ webkit: true, moz: true, ms: true, o: true }
			, "column-rule-color": 				{ webkit: true, moz: true, ms: true, o: true }
			, "column-rule-style": 				{ webkit: true, moz: true, ms: true, o: true }
			, "column-rule-width": 				{ webkit: true, moz: true, ms: true, o: true }
			, "column-span": 					{ webkit: true, moz: true, ms: true, o: true }
			, "column-width": 					{ webkit: true, moz: true, ms: true, o: true }
			, "columns": 						{ webkit: true, moz: true, ms: true, o: true }

			, "background-clip": 				{ webkit: true, moz: true, ms: true, o: true }
			, "background-origin": 				{ webkit: true, moz: true, ms: true, o: true }
			, "background-size": 				{ webkit: true, moz: true, ms: true, o: true }
			, "background-image": 				{ webkit: true, moz: true, ms: true, o: true }
			, "background": 					{ webkit: doGradient, moz: doGradient, ms: doGradient, o: doGradient }
			, "text-overflow": 					{ webkit: true, moz: true, ms: true, o: true }
			, "transition": 					{ webkit: true, moz: true, ms: true, o: true }
			, "transition-delay": 				{ webkit: true, moz: true, ms: true, o: true }
			, "transition-duration": 			{ webkit: true, moz: true, ms: true, o: true }
			, "transition-property": 			{ webkit: true, moz: true, ms: true, o: true }
			, "transition-timing-function": 	{ webkit: true, moz: true, ms: true, o: true }
			, "transform": 						{ webkit: true, moz: true, ms: true, o: true }
			, "transform-origin": 				{ webkit: true, moz: true, ms: true, o: true }

			, "display": 						{ webkit: false, moz: false, ms: false, o: false }
			, "opacity": 						{ webkit: false, moz: false, ms: false, o: false }
			, "appearance": 					{ webkit: true, moz: true, ms: true, o: true }
			, "hyphens": 						{ webkit: true, moz: true, ms: true, o: true }
		}





		// static method
		, "static fix": function( css ){
			if ( ! instance ) instance = new CSSPrefixer( { __internal_start__: 4786269 } );
			return instance.fix( css );
		}

		, init: function( options ){
			if ( !options || options.__internal_start__ !== 4786269 ) throw new Error( "please call the static function [fix] instead of instantiating the class!" );
		}
	} );



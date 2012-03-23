
	require( "./" )( "iridium test", 1 );


	var threads = 500
		, i =1000000000;

	var x = Date.now()
		, last = i;

	var log = iridium( "log" );

	var http = require( "http" );


	var dorequest = function(){
		var options = require( "url" ).parse( "http://konradm.onwander.com/leaderboard/cow_increment?amount=1000000" );

		options.method = "POST";
		options.header = {
			"Accept":"text/javascript, application/javascript, application/ecmascript, application/x-ecmascript, */*; q=0.01"
			, "Accept-Charset":"ISO-8859-1,utf-8;q=0.7,*;q=0.3"
			, "Accept-Encoding":"gzip,deflate,sdch"
			, "Accept-Language":"en,en-US;q=0.8,de-CH;q=0.6,de;q=0.4"
			, "Cache-Control":"no-cache"
			, "Connection":"keep-alive"
			, "Content-Length":"0"
			, "Cookie":"km_ai=irnXK1OuXFHu5fl1e5itL2Rcj98%3D; km_uq=; __utma=81186505.56506713.1332274131.1332274131.1332274131.1; __utmb=81186505.3.10.1332274131; __utmc=81186505; __utmz=81186505.1332274131.1.1.utmcsr=(direct)|utmccn=(direct)|utmcmd=(none); kvcd=1332275305686; km_vs=1; km_lv=1332275306; _chartbeat2=xq1lx1p41wn317tk.1332274133658.1332275315694.00000000000001; _wander_session=BAh7CEkiD3Nlc3Npb25faWQGOgZFRkkiJTkwZDg5YmM4OTc2ZmIwZTU5NDQwMWUxOTAzNGYwYzUxBjsAVEkiF2NhbGxpbmdfY29udHJvbGxlcgY7AEZJIhBsZWFkZXJib2FyZAY7AFRJIhNjYWxsaW5nX2FjdGlvbgY7AEZJIgppbmRleAY7AFQ%3D--d4b8e6895e5c6019d96e71e34c54b67915ba26f3"
			, "Host":"konradm.onwander.com"
			, "Origin":"http://konradm.onwander.com"
			, "Pragma":"no-cache"
			, "Referer":"https://twitter.com/intent/tweet"
			, "User-Agent":"Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/536.3 (KHTML, like Gecko) Chrome/19.0.1068.1 Safari/536.3"
			, "X-Requested-With":"XMLHttpRequest"
		};

		var req = http.request( options, function( res ){
			res.on( "end", function(  ){
				log.info( "remaingin requests " + i );
				i--;
				if ( x + 60000 < Date.now() ){
					log.info( "rate [" + ( last - i ) + "] / min.." );
					x = Date.now();
					last = i;
				}
				dorequest();
			}.bind( this ) )
		}.bind( this )  ).on( "error", function( err ){
			log.error( "error" );
			log.trace( err );
		}.bind( this ) );

		req.end();
	}



	while( threads-- ){
		dorequest();
	}



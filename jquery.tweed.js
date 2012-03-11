/*!
 * jQuery Tweed v1.0.0
 * https://github.com/Darsain/tweed
 *
 * Licensed under the MIT license.
 * http://www.opensource.org/licenses/MIT
 */

/*jshint eqeqeq: true, noempty: true, strict: true, undef: true, expr: true, smarttabs: true, browser: true */
/*global jQuery:false */

;(function($, undefined){
'use strict';

var pluginName = 'tweed',
	namespace = 'plugin_' + pluginName;

// Plugin "class"
function Plugin( container, q, o ){

	// Alias for this
	var self = this,

	// Plugin variables
		$cont = $(container),
		query = {},
		tIndex = 0,
		newestDate = 0,
		isFetching = 0,
		isFirstCall = 1,
		api, request, originalContent;


	/**
	 * Pause refreshing
	 *
	 * @public
	 */
	this.pause = function(){

		if( tIndex ){

			tIndex = clearTimeout(tIndex);

		} else if( o.refreshInterval ) {

			fetch();

		}

	};


	/**
	 * Resumes refreshing
	 *
	 * @public
	 */
	this.resume = function(){

		!tIndex && (tIndex = setTimeout( fetch, o.refreshInterval * 1000 ));

	};


	/**
	 * Refreshes tweets immediately
	 *
	 * @public
	 */
	this.refresh = function(){

		if( !isFetching ){

			tIndex && clearTimeout(tIndex);

			fetch(1);

		}

	};


	/**
	 * Destroys the plugin instance
	 *
	 * @public
	 */
	this.destroy = function(){

		clearTimeout( tIndex );
		$.removeData( container, namespace );
		$cont.unbind( '.' + namespace ).html( originalContent );

	};


	/**
	 * Render tweets into container
	 *
	 * @private
	 *
	 * @param {Array} tweets Array with tweets
	 */
	function render( tweets ){

		if( !tweets.length ) return;

		var oldItems = [],
			newItems = [],
			author, firstItemDate;

		for( var i = 0; i < tweets.length; i++ ){

			var tweet = tweets[i],
				user = tweet.retweeted_status ? tweet.retweeted_status.user : tweet.user,
				item;

			tweet.author     = tweet.from_user || user.screen_name;
			tweet.name       = tweet.from_user_name || user.name;
			tweet.author_url = 'http://twitter.com/' + tweet.author;
			tweet.tweet      = o.linkify ? linkify(tweet.text) : tweet.text;
			tweet.tweet_url  = 'http://twitter.com/' + tweet.author + '/statuses/' + tweet.id_str;
			tweet.date       = parseTime(tweet.created_at);
			tweet.time       = relativeTime(tweet.date);

			tweet.avatar_url = tweet.profile_image_url || user.profile_image_url;
			tweet.avatar_mini_url = tweet.avatar_url.replace(/_normal/gi, '_mini');
			tweet.avatar_bigger_url = tweet.avatar_url.replace(/_normal/gi, '_bigger');
			tweet.avatar     = '<img src="' + tweet.avatar_url + '" alt="' + tweet.author + '\'s avatar" />';
			tweet.avatar_mini = '<img src="' + tweet.avatar_mini_url + '" alt="' + tweet.author + '\'s avatar" />';
			tweet.avatar_bigger = '<img src="' + tweet.avatar_bigger_url + '" alt="' + tweet.author + '\'s avatar" />';

			// Create a tweet element from options template
			item = $( o.template.replace( /\{\{ ?([a-z_]+) ?\}\}/gi, function(s,k){ return tweet[k]; }) )[0];

			// Divide items between new and old ones
			if( tweet.date > newestDate ){

				newItems.push( item );

			} else {

				oldItems.push( item );

			}

			// If first tweet
			if( !i ){

				firstItemDate = tweet.date;

				// Set author data
				author = query.type !== 'author' ? false : {
					username:    tweet.author,
					name:        tweet.user.name,
					url:         tweet.author_url,
					description: tweet.user.description,
					website:     tweet.user.url,
					followers:   tweet.user.followers_count,
					avatar_url:  tweet.avatar_url,
					avatar_mini_url: tweet.avatar_mini_url,
					avatar_bigger_url: tweet.avatar_bigger_url,
					avatar:      tweet.avatar,
					avatar_mini: tweet.avatar_mini,
					avatar_bigger: tweet.avatar_bigger,
					last_tweet:  tweet,
					location:    tweet.user.location,
					tweets:      tweet.user.statuses_count,
					following:   tweet.user.friends_count
				};

			}

		}

		// Update newest date timestamp
		newestDate = firstItemDate;

		// If first call remove whatever was there before
		if( isFirstCall ){

			isFirstCall = 0;

		}

		// Create jQuery objects
		var $newTweets = $(newItems),
			$tweets = $newTweets.add(oldItems);

		// Refresh old tweets and fade in new ones
		$newTweets.hide();
		$tweets.appendTo( $cont.empty() );
		$newTweets.fadeIn(1000);

		// Trigger :load event
		$cont.trigger( pluginName + ':load', [ $tweets, $newTweets, author ] );

	}


	/**
	 * Fetch tweets
	 *
	 * @private
	 *
	 * @param {Bool} isRefresh Whether this fetch is a user requested refresh
	 */
	function fetch( isRefresh ){

		// Starting fetching
		isFetching = 1;

		// Trigger :fetch event
		$cont.trigger( pluginName + ':fetch' );

		// Create an API request
		var dfd = $.getJSON( api + '?callback=?', request );

		// When request is done
		dfd.always(function(){

			// No longer fetching data
			isFetching = 0;

		}).fail(function(){

			// If we got an error response, refetch in 2 second
			// as twitter servers are probably overloaded
			tIndex = setTimeout( fetch, 2000 );

		}).done(function(data){

			// Render tweets
			render( data.results || data );

			// Set refresh timeout if requested
			if( o.refreshInterval > 0 && !isRefresh ){

				tIndex = setTimeout( fetch, o.refreshInterval * 1000 );

			}

		});

	}


	/**
	 * Linkify tweet message
	 *
	 * @private
	 *
	 * @param {String} message Twitter message
	 *
	 * @returns {String} Twitter message with URLs and twitter hashes transformed into link anchors
	 */
	function linkify( message ){

		var regexps = [
					/[\@]+([A-Za-z0-9_\-]+)/gi,         // User links
					/(?:^| )[\#]+([A-Za-z0-9\-_]+)/gi,  // Hash links
					/((ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?)/g // URL links
				],
			replace = [
					'<a href="http://twitter.com/$1">@$1</a>',              // User links
					' <a href="http://twitter.com/search?q=%23$1">#$1</a>', // Hash links
					'<a href="$1">$1</a>'                                   // URL links
				];

		for( var i = regexps.length; i > 0; ){

			message = message.replace(regexps[--i], replace[i]);

		}

		return message;

	}


	/**
	 * Parse twitter time string
	 *
	 * stolen from seaofclouds/tweet plugin (I wasn't happy with it, that's why I'm writing this one)
	 *
	 * @private
	 *
	 * @param {String} twitter_time Twitter date string
	 *
	 * @returns {Int} UNIX timestamp
	 */
	function parseTime( twitter_time ){

		// The non-search twitter APIs return inconsistently-formatted dates, which Date.parse
		// cannot handle in IE. We therefore perform the following transformation:
		// "Wed Apr 29 08:53:31 +0000 2009" => "Wed, Apr 29 2009 08:53:31 +0000"
		return Date.parse( twitter_time.replace( /^([a-z]{3})( [a-z]{3} \d\d?)(.*)( \d{4})$/i, '$1,$2$4$3' ) );

	}


	/**
	 * Format time into relative readable string
	 *
	 * @private
	 *
	 * @param {Int} time UNIX timestamp
	 *
	 * @returns {String} Human readable relative time string
	 */
	function relativeTime( time ){

		var delta = Math.abs( parseInt( ( +new Date() - time ) / 1000, 10 ) ),
			output = '';

		if (delta < 60)             output = delta + ' seconds ago';
		else if(delta < 120)        output = 'a minute ago';
		else if(delta < (45*60))    output = parseInt(delta / 60, 10) + ' minutes ago';
		else if(delta < (2*60*60))  output = 'an hour ago';
		else if(delta < (24*60*60)) output = parseInt(delta / 3600, 10) + ' hours ago';
		else if(delta < (48*60*60)) output = 'a day ago';
		else                        output = parseInt(delta / 86400, 10) + ' days ago';

		return output;

	}


	/** Constructor */
	(function(){

		// Store original container HTML
		originalContent = $cont.html();

		// Parse query
		var match = 0;

		if( null !== ( match = /^@([a-z0-1._\-]+)$/i.exec(q) ) ){

			query = {
				type: 'author',
				author: match[1]
			};

		} else if( null !== ( match = /^@([a-z0-1._\-]+)\/([a-z0-1._\-]+)$/i.exec(q) ) ){

			query = {
				type: 'list',
				author: match[1],
				list:  match[2]
			};

		} else {

			query = {
				type: 'search',
				search: q
			};

		}

		// Build API URL and request object based on query
		api = 'https:' === document.location.protocol ? 'https://' : 'http://';

		switch( query.type ){
			case 'author':
					api += 'api.twitter.com/1/statuses/user_timeline.json';
					request = {
						include_rts: o.retweets,
						screen_name: query.author,
						count: o.limit
					};
			break;

			case 'list':
					api += 'api.twitter.com/1/lists/statuses.json';
					request = {
						page: 1,
						include_rts: o.retweets,
						slug: query.list,
						owner_screen_name: query.author,
						per_page: o.limit
					};
			break;

			default:
					api += 'search.twitter.com/search.json';
					request = {
						q: query.search,
						rpp: o.limit
					};
		}

		// Pause on hover
		o.refresh && $cont.bind('mouseenter.' + namespace + ' mouseleave.' + namespace, function(e){

			self[ e.type === 'mouseenter' ? 'pause' : 'resume' ]();

		});

		// Fetch and render tweets
		fetch();

	}());

}


// jQuery plugin extension
$.fn[pluginName] = function( query, options ){

	var	method = query === false ? 'destroy' : query,
		methodArgs = Array.prototype.slice.call( arguments, 1 ),
		o = $.isPlainObject(options) ? $.extend( {}, $.fn[pluginName].defaults, options ) : $.fn[pluginName].defaults;

	// Call plugin on all elements
	return this.each(function( i, container ){

		// Plugin call with prevention against multiple instantiations
		var stored = $.data( container, namespace ),
			plugin = stored || $.data( container, namespace, new Plugin( container, query, o ) );

		// Call the method if requested
		stored && $.isFunction( plugin[method] ) && plugin[method].apply( plugin, methodArgs );

	});

};


// Default options
$.fn[pluginName].defaults = {
	limit:           5,   // how many tweets to display
	retweets:        1,   // include retweets in timelines
	linkify:         1,   // linkify URL, @author, and #hash strings in tweets ('@author' => '<a href="http://twitter.com/author">@author</a>')
	refreshInterval: 0,   // refresh interval in seconds, leave 0 to disable
	pauseOnHover:    0,   // when refreshing is enabled, pause it when mouse hovers over tweets container
	template: '<li><span class="text">{{tweet}}</span><br><a href="{{author_url}}" class="author">{{author}}</a> <a href="{{tweet_url}}" class="time">{{time}}</a></li>'
	// HTML template with mustache-like tags {{...}} that will be replaced with tweet data
	// available keys: author, name, author_url, tweet, tweet_url, time, followers, avatar_url, avatar, avatar_mini, avatar_bigger
	// (also all keys from a JSON response are available)
};

}(jQuery));
jQuery(function($){

	// Trigger prettyPrint
	prettyPrint();

	// -----------------------------------------------------------------------------------
	//   Page scripts
	// -----------------------------------------------------------------------------------

	var $tabs = $('#tabs').find('li'),
		$container = $('#sections'),
		$sections = $container.children(),
		hashId = window.location.hash.replace(/^#tab=/, ''),
		initial = hashId && $sections.filter('#'+hashId).length ? hashId : $tabs.eq(0).data('activate'),
		activeClass = 'active',
		hiddenClass = 'hidden';

	// Tabs navigation
	$tabs.on('click', function(e){

		activate( $(this).data('activate') );

		e.preventDefault();

	});

	// Back to top button
	$('a[href="#top"]').on('click', function(e){
		e.preventDefault();
		$(document).scrollTop(0);
	});

	// Tweed wrappers
	$(".tweed").each(function(i,e){

		var $cont = $(e),
			$wrap = $cont.closest('.wrap'),
			$status = $wrap.find('.status'),
			query = $cont.data("query"),
			options = $cont.data("options"),
			authorDataDisplayed = 0,
			hideIndex = 0;

		// Custom tweet template
		options.template = '<li class="clearfix">';
		options.template += '{{avatar_bigger}} <span class="text">{{tweet}}</span> <br>';
		options.template += '<a href="{{author_url}}" class="author">@{{author}}</a>, <a href="{{tweet_url}}" class="time">{{time}}</a>';
		options.template += '</li>';

		// Bind fetch event
		$cont.on('tweed:fetch', function( e, $tweets, $newTweets, author ){

			$status.stop().text('').show().addClass('loading');

		});

		// Bind load event
		$cont.on('tweed:load', function( e, $tweets, $newTweets, author ){

			$status.removeClass('loading').text( $newTweets.length + ' new' );

			clearTimeout(hideIndex);
			hideIndex = setTimeout(function(){

				$status.fadeOut();

			}, 2000);

			if( author && !authorDataDisplayed ){

				var	html = '<div class="authorinfo clearfix">';
				html += author.avatar;
				html += '<h2>' + author.name + '</h2>';
				html += '<span>' + author.tweets + ' tweets, ' + author.followers + ' followers</span>';
				html += '</div>';

				$cont.before( html );

				authorDataDisplayed = 1;
			}

		});

		// Call tweed
		$cont.tweed( query, options );

		// Controls
		$wrap.on('click', "[data-action]", function(){

			var $el = $(this),
				method = $el.data('action');

			$cont.tweed( method );

		});

	});


	// Activate initial section
	activate( initial );

	// Activate section (it misbehaves when sly is called on hidden sections)
	function activate( sectionId ){

		window.location.hash = 'tab='+sectionId;

		$tabs.removeClass(activeClass).filter('[data-activate='+sectionId+']').addClass(activeClass);

		$sections.addClass(hiddenClass).filter('#'+sectionId).removeClass(hiddenClass);

	}

});
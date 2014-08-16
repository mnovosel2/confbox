document.addEventListener("deviceready", function() {
// $(function() {
    var myApp = new Framework7(),
        $$ = Framework7.$,
        mainView = myApp.addView('.view-main', {
            dynamicNavbar: true
        }),
        baseUrl = 'http://cortex.foi.hr/confbox/',
        sessionIndicator = false,
        trackIndicator = false,
        conferenceIndicator = false,
        chairIndicator = false,
        locationIndicator = false,
        participantIndicator = false,
        trackArray = [],
        sessionArray = [],
        conferenceArray = [],
        globalSpeakerList = {},
        globalTabBlock,
        globalSpeakerBlock,
        globalScheduleBlock = {};
    FastClick.attach(document.body);

    var ajaxRequest = function(destination, dataToSend) {
        return $.ajax({
            'url': baseUrl + destination,
            'type': 'GET',
            'data': dataToSend,
            'dataType': 'json'
        });
    };
    $(document).one('click', '.conference-main-link', function() {

        myApp.showPreloader('Please wait');

    });
    $$(document).on('pageInit', function(e) {
        var page = e.detail.page,
            sessionId = "",
            conferenceId = "";
        if (page.name !== 'speaker-list') {
            $$('.main-link-speakers').on('click', function() {

                myApp.showPreloader('Please wait');

            });
        } else {
            $$('.main-link-speakers').on('click', function() {
                myApp.hidePreloader();

            });
        }

        if (page.name === 'event-list') {
            sessionId = page.query.eventId;
            listEvents(sessionId);
        }
        if (page.name === 'schedule-details') {
            conferenceId = page.query.conferenceId;
            myApp.hidePreloader();
            $('.schedule-main-link').attr('href', 'schedule.html?conferenceId=' + conferenceId);
            $('.news-feed-link').attr('href', 'news.html?conferenceId=' + conferenceId);
            $('.main-link-about').attr('href', 'about-panel.html?conferenceId=' + conferenceId);
            $('.about-conf-btn').attr('href', 'about-conference.html?conferenceId=' + conferenceId);
            $('.conf-contacts-btn').attr('href', 'conference-contacts.html?conferenceId=' + conferenceId);

            scheduleTracks(conferenceId);
        }
        if (page.name === 'about-conference') {
            conferenceId = page.query.conferenceId;
            aboutConference(conferenceId);
        }
        if (page.name === 'conference-contacts') {
            conferenceId = page.query.conferenceId;
            conferenceContacts(conferenceId);
        }
        if (page.name === 'conference-list') {

            myApp.hidePreloader();
            myApp.closePanel();
            var conferences = listDBValues('conferences', null, null);
            listConferences(conferences);
        }
        if (page.name === 'add-conference-panel') {
            handleSubmit('.panel-button-submit');
        }
        if (page.name === 'paper-list') {
            var paperId = page.query.paperId;
            listPapers(paperId);
        }

        if (page.name === 'paper-details') {

            var paperDetailId = page.query.paperId;
            paperDetails(paperDetailId);
        }
        if (page.name === 'paper-comments') {
            var paperCommentsId = page.query.paperId;
            paperComments(paperCommentsId);
            $(document).on('click', '.comment-btn', function() {
                var title = $('#comment-title').val(),
                    content = $('#comment-content').val();
                if ($.trim(title) != "" && $.trim(content) != "") {
                    addValueToDB('paper_comments', [parseInt(paperCommentsId, 10), title, content], 'paper_id,title,content');
                    paperComments(paperCommentsId);
                    myApp.closeModal('.popup-comment');
                } else {
                    myApp.alert('Required fields are blank.', 'Missing fields');
                }
            });
        }
        if (page.name === 'news') {
            var conferenceNewsId = page.query.conferenceId;
            listNews(conferenceNewsId);
        }
        if (page.name === 'maps') {
            var width = $('.map-content').width(),
                height = $('.map-content').height(),
                confId = page.query.confId;
            $('#map').css({
                width: width,
                height: height
            });
            createMapAndMarkers(confId);
        }
        if (page.name === 'speaker-list') {
            var confId = page.query.confId;
            myApp.hidePreloader();
            groupSpeakers(confId);
        }
        if (page.name === 'about-panel') {
            var conferId = page.query.conferenceId,
                conferenceById = listDBValues('conferences', null, 'WHERE id_conference=', conferId);
            if (conferenceById[0][14] != "") {
                $('.about-err').hide();
                $('#tab1').html(conferenceById[0][14]);
            }
            if (conferenceById[0][15] != "") {
                $('.about-err').hide();
                $('#tab2').html(conferenceById[0][15]);
            }
        }
        if (page.name === 'speaker-details') {
            var speakerId = page.query.speakerId;
            speakerDetails(speakerId);
        }
        if (page.name === 'social-events') {
            var confId = page.query.confId;
            socialEvents(confId);
        }
        if (page.name === 'social-map') {
            var mapWidth = $('.map-content').width(),
                mapHeight = $('.map-content').height();
            $('#social-map').css({
                width: mapWidth,
                height: mapHeight
            });
            var session = page.query.sessionId,
                eventId = page.query.eventId;
            createSocialMap(session, eventId);
        }
    });



    function getCatalogs() {
        var data = {
            method: "getCatalogs"
        };
        ajaxRequest('catalogs.php', data).done(parseCatalogs);
        ajaxRequest('catalogs.php', data).fail(function() {
            myApp.alert('Unfortunately, application can\'t contact server', 'Communication error');
        });
    }

    function stringToHtml(string) {
        return $.parseHTML(string);
    }

    function aboutConference(conferenceId) {
        var conference = listDBValues('conferences', null, 'WHERE id_conference=', conferenceId),
            conferenceHtml = [],
            $aboutBlock = $('.about-conference-block');

        conferenceHtml = stringToHtml(conference[0][14]);
        if (conferenceHtml) {
            $aboutBlock.empty().html(conferenceHtml);
            $.each($aboutBlock.children('img'), function(index, value) {
                cacheItem($(value));
            });
        } else {
            $aboutBlock.empty().html('<p class="about-conf-err">No about info for selected conference</p>');
        }
    }

    function conferenceContacts(conferenceId) {
        var conference = listDBValues('conferences', null, 'WHERE id_conference=', conferenceId),
            conferenceHtml = [],
            $contactBlock = $('.conference-contact-block');

        conferenceHtml = stringToHtml(conference[0][15]);
        if (conferenceHtml) {
            $contactBlock.empty().html(conferenceHtml);
            $.each($contactBlock.children('img'), function(index, value) {
                cacheItem($(value));
            });
        } else {
            $contactBlock.empty().html('<p class="about-conf-err">No contact info for selected conference</p>');
        }
    }

    function speakerDetails(speakerId) {
        var speaker = listDBValues('participants', null, 'WHERE id_participant=', speakerId),
            contentBlock = $('.speaker-block'),
            content = "",
            organization = [];
        for (var i = 0, speakerLen = speaker.length; i < speakerLen; i++) {
            if (speaker[i][4] != "") {
                content += '<div class="speaker-picture"><img class="speaker-img" src="' + speaker[i][4] + '"></div>';
            } else if (speaker[i][4] === "") {
                content += '<div class="speaker-picture"><img class="speaker-img" src="img/dummy.jpg"></div>';
            }

            content += '<p class="speaker-name">' + speaker[i][1] + ' ' + speaker[i][2] + ', ' + speaker[i][3] + '</p>';
            content += '<p class="speaker-email"><span class="speaker-content-header">Email:</span> ' + speaker[i][11] + '</p>';
            if (speaker[i][6] != "") {
                content += '<p class="speaker-email"><span class="speaker-content-header">Address:</span> ' + speaker[i][6] + '</p>';
            }
            if (speaker[i][8] != "") {
                content += '<p class="speaker-email"><span class="speaker-content-header">Country:</span> ' + speaker[i][8] + '</p>';
            }
            if (speaker[i][7] != "") {
                content += '<p class="speaker-email"><span class="speaker-content-header">City:</span> ' + speaker[i][7] + '</p>';
            }
            if (speaker[i][13] != "") {
                organization = listDBValues('organizations', null, 'WHERE id_organization=', speaker[i][13]);
                content += '<p class="speaker-org"><span class="speaker-content-header">Organization:</span> ' + organization[0][1] + '</p>';
            }
            if (speaker[i][6] != "" && speaker[i][8] != "") {
                content += '<p class="speaker-address">' + speaker[i][6] + ', ' + speaker[i][8] + '</p>';
            }
            if (speaker[i][12] != "") {
                content += '<span class="speaker-content-header speaker-bio-title">Biography:</span><br><p class="speaker-bio">' + speaker[i][12] + '</p>';
            }
        }
        contentBlock.append(content).each(cacheItem($('.speaker-img')));
    }

    function parseCatalogs(response) {
        var data = response.data;
        try {
            $.each(data.participant_types, function(i, value) {
                addValueToDB('participant_types', [value.id_participant_type, value.name, value.created, value.deleted]);
            });
            $.each(data.event_types, function(i, value) {

                addValueToDB('event_types', [value.id_event_type, value.name, value.type, value.created, value.deleted]);
            });
            $.each(data.paper_types, function(i, value) {

                addValueToDB('paper_types', [value.id_paper_type, value.name, value.field, value.created, value.deleted]);
            });
            for (var i in data) {
                if (data.hasOwnProperty(i)) {
                    addValueToDB('updated_catalogs', [i, response.timeStamp]);
                }
            }
        } catch (e) {
            myApp.alert('Error fetching catalogs', 'Communication error');
        }

    }

    function groupSpeakers(confId) {
        var tabBlock = $('.speaker-tab-block'),
            speakerBlock = $('.speaker-main-block');
        if (!$.isEmptyObject(globalSpeakerList)) {
            tabBlock.append(globalTabBlock);
            speakerBlock.append(globalSpeakerBlock);
            for (var i in globalSpeakerList) {
                if (globalSpeakerList.hasOwnProperty(i)) {
                    $('.' + i).show().append(globalSpeakerList[i]);
                }
            }
            return;
        }

        var speakerRole = listDBValues('participants_roles', null, null),
            participantType = listDBValues('participant_types', null, null),
            tabStructure = "",
            content = "",
            participantTypeUnique = [],
            participantTypeList = [],
            speakers = [],
            participant = [];
        for (var i = 0, speakLen = speakerRole.length; i < speakLen; i++) {
            participantType = listDBValues('participant_types', null, 'WHERE id_participant_type=', speakerRole[i][1]);
            participant = listDBValues('participants', null, 'WHERE id_participant=' + "'" + speakerRole[i][0] + "' AND conference=", confId);
            if (participant.length > 0) {
                if (participantType.length > 0) {
                    participant[0].push(participantType[0][1]);
                }
                speakers.push(participant);
            }

            if (participantType.length > 0) {
                participantTypeList.push(participantType[0][1]);
            }
        }
        speakers = compactArray(speakers);
        speakers.sort(function(a, b) {
            if (a[2] < b[2]) return -1;
            if (a[2] > b[2]) return 1;
            return 0;
        });
        if (speakers.length == 0) {
            $('.speaker-list-err').show();
            return;
        }
        $('.speaker-list-err').hide();
        $.each(participantTypeList, function(i, el) {
            if ($.inArray(el, participantTypeUnique) === -1) participantTypeUnique.push(el);
        });
        for (var k = 0, partTypeLen = participantTypeUnique.length; k < partTypeLen; k++) {
            if (k == 0) {
                tabStructure += '<a href="#' + participantTypeUnique[k].toLowerCase().replace(" ", '-') + '" class="tab-link active button">' + participantTypeUnique[k].toUpperCase() + '</a>';
                content += '<div class="tab active" id="' + participantTypeUnique[k].toLowerCase().replace(" ", '-') + '">' + '<p class="participant-collection-title">' + participantTypeUnique[k].toLowerCase() + '</p>' + '<div class="list-block media-list"><ul class="' + participantTypeUnique[k].toLowerCase().replace(" ", '-') + '-list"></ul></div></div>';
            } else {
                tabStructure += '<a href="#' + participantTypeUnique[k].toLowerCase().replace(" ", '-') + '" class="tab-link button">' + participantTypeUnique[k].toUpperCase() + '</a>';
                content += '<div class="tab" id="' + participantTypeUnique[k].toLowerCase().replace(" ", '-') + '">' + '<p class="participant-collection-title">' + participantTypeUnique[k].toLowerCase() + '</p>' + '<div class="list-block media-list"><ul class="' + participantTypeUnique[k].toLowerCase().replace(" ", '-') + '-list"></ul></div></div>';
            }
        }
        globalTabBlock = tabStructure;
        globalSpeakerBlock = content;
        tabBlock.append(tabStructure);
        speakerBlock.append(content);
        for (var g = 0, participantUniqueLen = participantTypeUnique.length; g < participantUniqueLen; g++) {
            var speakerList = "",
                listBlock = $('.' + participantTypeUnique[g].toLowerCase().replace(" ", '-') + '-list');

            for (var f = 0, speakerListLen = speakers.length; f < speakerListLen; f++) {
                var speakerItemLen = speakers[f].length;
                var academic_title = "";
                var email = "";
                var country = "";
                var organizations;
                if (speakers[f][speakerItemLen - 1].toLowerCase() == participantTypeUnique[g].toLowerCase()) {
                    if (speakers[f][3] != "")
                        academic_title = ", " + speakers[f][3];
                    if (speakers[f][11] != "")
                        email = '<div class="item-subtitle">' + speakers[f][11] + '</div>';
                    speakerList +=
                        '<li>' +
                        '<a href="speaker.html?speakerId=' + speakers[f][0] + '" class="item-link item-content">' +
                        '<div class="item-media"></div>' +
                        '<div class="item-inner">' +
                        '<div class="item-title-row">' +
                        '<div class="item-title">' + speakers[f][1] + ' ' + speakers[f][2] + academic_title + '</div>' +
                        '</div>' +
                        email +
                        '<div class="item-subtitle">' + speakers[f][8] + '</div>' +
                        '</div>' +
                        '</a>' +
                        '</li>';
                }

            }
            listBlock.show().append(speakerList);
            globalSpeakerList[participantTypeUnique[g].toLowerCase().replace(" ", '-') + '-list'] = speakerList;
        }

    }
    var handleSubmit = function(attr) {
        $(attr).off('click').on('click', function(e) {
            myApp.showPreloader('Adding conference, please be patient.');
            e.preventDefault();
            var value = $('#conf-code').val();
            var data = {
                key: value,
                method: 'getConferences'
            };

            ajaxRequest('conference_details.php', data).done(getConferences);
            ajaxRequest('conference_details.php', data).fail(function() {
                myApp.alert('Unfortunately, application can\'t contact server', 'Communication error');
            });
        });

    };

    function cacheItem(target) {
        ImgCache.isCached(target.attr('src'), function(path, success) {
            if (success) {
                ImgCache.useCachedFile(target);
            } else {
                ImgCache.cacheFile(target.attr('src'), function() {
                    ImgCache.useCachedFile(target);
                });

            }
        });
    }
    var getConferences = function(response) {
        var data = response.data,
            conferencesByKey = [];
        if (response.responseId == 100) {

            conferencesByKey = listDBValues('conferences', null, 'WHERE conference_key=', data.conference.key);
            if (conferencesByKey.length == 0) {
                getCatalogs();
                if (!$('.conf-main-link').hasClass('link-to-conferences')) {
                    $('.conf-main-link').addClass('link-to-conferences');
                    $('.link-to-conferences').css('color', 'black');
                    $('.conferences-icon').css('color', 'black');
                }
                try {
                    addValueToDB('conferences', [data.conference.id_conference, data.conference.name, data.conference.key, data.conference.abb, data.conference.description, data.conference.logo, data.conference.starts, data.conference.ends, data.conference.url, data.conference.lat, data.conference.lng, data.conference.created, data.conference.updated, data.conference.deleted, data.conference.about, data.conference.contact]);
                    $.each(data.sessions, function(index, value) {
                        addValueToDB('sessions', [value.id_session, value.name, value.date, value.time, value.track, value.location, value.created, value.update, value.deleted]);

                    });
                    $.each(data.tracks, function(index, value) {
                        addValueToDB('tracks', [parseInt(value.id_track, 10), value.name, value.description, parseInt(value.conference, 10), value.created, value.update, value.deleted]);

                    });
                    $.each(data.chair, function(index, value) {
                        addValueToDB('chairs', [parseInt(value.id_chair_participant, 10), parseInt(value.id_chair_session, 10), value.created, value.update, value.deleted, parseInt(value.id_chair, 10)]);

                    });

                    $.each(data.locations, function(index, value) {
                        addValueToDB('locations', [parseInt(value.id_location, 10), value.name, value.address, value.capacity, value.description, value.picture, data.conference.id_conference, value.lat, value.lng, value.created, value.update, value.deleted]);

                    });
                    $.each(data.participants, function(index, value) {
                        addValueToDB('participants', [parseInt(value.id_participant, 10), value.name, value.surname, value.title, value.picture, value.field, value.address, value.city, value.country, value.zip, value.phone, value.email, value.biography, value.organization, value.conference, value.created, value.updated, value.deleted]);

                    });
                    $.each(data.events, function(index, value) {
                        addValueToDB('events', [parseInt(value.id_event, 10), value.name, value.description, value.time, value.duration, value.paper, value.type, value.session, value.created, value.updated, value.deleted]);
                    });
                    $.each(data.papers, function(index, value) {
                        addValueToDB('papers', [parseInt(value.id_paper, 10), value.paper_name, value.date, value.type, value.summary, value.track, value.created, value.updated, value.deleted]);
                    });
                    $.each(data.authors, function(index, value) {
                        addValueToDB('authors', [parseInt(value.id_participant, 10), parseInt(value.id_paper, 10), value.picture, value.created, value.updated, value.deleted, parseInt(value.id_author, 10)]);
                    });
                    $.each(data.organizations, function(index, value) {
                        addValueToDB('organizations', [parseInt(value.id_organization, 10), value.name, value.zip, value.address, value.phone, value.city, value.country, value.email, value.VAT, value.url, value.created, value.updated, value.deleted]);
                    });
                    $.each(data.news, function(index, value) {
                        addValueToDB('news', [parseInt(value.id_news, 10), value.conference, value.heading, value.time, value.content, value.url, value.created, value.updated, value.deleted]);
                    });
                    $.each(data.roles, function(index, value) {
                        addValueToDB('participants_roles', [parseInt(value.participant_id, 10), parseInt(value.participant_types_id, 10), value.created, value.updated, value.deleted, parseInt(value.roles_id, 10)]);

                    });

                    $(mainView.loadPage('conference-list.html'));
                } catch (e) {

                    myApp.alert('Unfortunately, required data is missing', 'Required data missing', function() {
                        myApp.hidePreloader();
                    });
                }

            } else {
                myApp.alert('Conference with this key already exist', 'Conference exist', function() {
                    myApp.hidePreloader();
                });
            }

        } else {
            myApp.alert('Unfortunately, this conference key does not exist', 'Conference missing', function() {
                myApp.hidePreloader();
            });
        }
    };

    function compactArray(items) {
        var tmpArr = [];
        for (var i = 0, itemLen = items.length; i < itemLen; i++) {
            for (var j = 0, subItemLen = items[i].length; j < subItemLen; j++) {
                tmpArr.push(items[i][j]);
            }
        }
        return tmpArr;
    }

    function participantOrganization(participants) {
        var organization = [],
            tmpArr = [];
        if (participants[13] != "") {
            tmpArr = listDBValues('organizations', null, 'WHERE id_organization=', participants[13]);
            organization.push(tmpArr);
        }
        return compactArray(organization);
    }

    function setShowAuthors() {
        $(document).off('click', '.show-paper-authors').on('click', '.show-paper-authors', function() {
            var self = $(this);
            var $expandedContent = $('.author-list');
            if (self.next($expandedContent).css('display') === 'none') {
                self.next($expandedContent).slideDown(400);
            } else {
                self.next($expandedContent).slideUp(400);
            }
        });
    }

    function createSocialMap(sessionId, eventId) {
        if (navigator.network.connection.type == Connection.NONE) {
            $('#social-map').empty().html('<p class="map-error">Internet connection required</p>');
            return;
        }
        var locations = [],
            gm,
            map,
            oms,
            marker,
            latLng,
            locationsWithCoords = [],
            events = listDBValues('events', null, 'WHERE id_event=', eventId),
            session = listDBValues('sessions', null, 'WHERE id_session=', events[0][7]);
        if (session.length > 0) {
            locations = listDBValues('locations', null, 'WHERE id_location=', session[0][5]);
        }

        for (var i = 0, locationLen = locations.length; i < locationLen; i++) {
            if (locations[i][7] != "" && locations[i][8] != "") {
                locationsWithCoords.push(locations[i]);
            }
        }
        if (locationsWithCoords.length > 0) {
            $('#social-map').empty();
            gm = google.maps;
            var mapOptions = {
                mapTypeId: gm.MapTypeId.ROADMAP,
                zoom: 13,
                scrollwheel: false
            };
            for (var j = 0, locationCoordsLen = locationsWithCoords.length; j < locationCoordsLen; j++) {
                if (locationsWithCoords[j][0] === session[0][5]) {
                    mapOptions.center = new gm.LatLng(locationsWithCoords[j][7], locationsWithCoords[j][8]);
                }
            }
            if (!mapOptions.center) {
                mapOptions.center = new gm.LatLng(locationsWithCoords[0][7], locationsWithCoords[0][8]);
            }
            map = new gm.Map(document.getElementById('social-map'), mapOptions);
            oms = new OverlappingMarkerSpiderfier(map, {
                keepSpiderfied: true,
            });
            for (var k = 0, locationWithCoordsLen = locationsWithCoords.length; k < locationWithCoordsLen; k++) {
                latLng = new gm.LatLng(locationsWithCoords[k][7],
                    locationsWithCoords[k][8]);
                if (locationsWithCoords[k][0] == session[0][5]) {
                    marker = new gm.Marker({
                        position: latLng,
                        map: map,
                        icon: 'img/pin_blue.png'
                    });

                    marker.desc = '<b>' + events[0][1] + '</b><br><br>';

                    marker.desc += locations[k][1] + '<br>';

                    marker.desc += events[0][3] + '&nbsp;&nbsp;' + events[0][4] + '<br>' + events[0][2];
                    var iw = new gm.InfoWindow();
                    oms.addListener('click', function(marker, event) {
                        iw.setContent(marker.desc);
                        iw.open(map, marker);
                    });
                } else {
                    marker = new gm.Marker({
                        position: latLng,
                        map: map,
                        icon: 'img/pin.png'
                    });
                }

                oms.addMarker(marker);
            }
        }

    }

    function createMapAndMarkers(confId) {
        if (navigator.network.connection.type == Connection.NONE) {
            $('#map').empty().html('<p class="map-error">Internet connection required</p>');
            return;
        }
        var conferences = listDBValues('conferences', null, 'WHERE id_conference=', confId),
            locationsAll = listDBValues('locations', null, 'WHERE conference=', confId),
            markers = [],
            locations = [];
        for (var i = 0, locationLen = locationsAll.length; i < locationLen; i++) {
            if (locationsAll[i][7] != "" && locationsAll[i][8] != "") {
                locations.push(locationsAll[i]);
            }
        }
        if (locations.length == 0) {
            $('#map').empty().html('<p class="map-error">There are no adequately formatted locations for added conferences</p>');
            return;
        }
        if (locations.length > 0) {
            $('#map').empty();
            var gm = google.maps;
            var map = new gm.Map(document.getElementById('map'), {
                mapTypeId: gm.MapTypeId.ROADMAP,
                center: new gm.LatLng(locations[0][7], locations[0][8]),
                zoom: 13,
                scrollwheel: false
            });
            var oms = new OverlappingMarkerSpiderfier(map, {
                keepSpiderfied: true,
            });
            for (var i = 0, confLen = conferences.length; i < confLen; i++) {
                for (var j = 0, locLen = locations.length; j < locLen; j++) {
                    if (locations[j][6] == conferences[i][0] && locations[j][7] != "" && locations[j][8] != "") {
                        var latLng = new gm.LatLng(locations[j][7],
                            locations[j][8]);
                        var marker = new gm.Marker({
                            position: latLng,
                            map: map,
                            icon: 'img/pin.png'
                        });
                        if (locations[j][1] != "") {
                            marker.desc = locations[j][1];
                        }
                        marker.desc += '<br><br>' + locations[j][2] + '<br>' + locations[j][4];

                        var iw = new gm.InfoWindow();
                        oms.addListener('click', function(marker, event) {
                            iw.setContent(marker.desc);
                            iw.open(map, marker);
                        });
                        oms.addMarker(marker)
                    }

                }
            }

        }

    }

    function listNews(conferenceId) {
        var news = listDBValues('news', null, 'WHERE conference=', conferenceId),
            newsContent = "";
        // console.log(news);
        if (news.length > 0) {

            for (var i = 0, newsLen = news.length; i < newsLen; i++) {
                newsContent += '<div class="content-block-inner news-block-inner">';
                newsContent += '<p class="news-title">' + news[i][2] + '</p>';
                newsContent += '<p class="news-time">' + news[i][3] + '</p>';
                newsContent += '<p class="news-content">' + news[i][4] + '</p>';
                if (news[i][5] != "") {
                    newsContent += '<p class="news-content">' + news[i][5] + '</p>';
                }
                newsContent += '</div>';
            }
            $('.news-block').empty().append(newsContent);
        }
    }

    function paperComments(paperId) {
        var commentList = listDBValues('paper_comments', null, 'WHERE paper_id=', paperId),
            paperCommentList = "";
        if (commentList.length > 0) {
            paperCommentList += '<p class="add-comment-btn"><a href="#" data-popup=".popup-comment" class="open-popup">Add new comment</a>';
            for (var i = 0, commentLen = commentList.length; i < commentLen; i++) {
                paperCommentList += '<div class="content-block-inner paper-block-inner">';
                paperCommentList += '<p class="comment-title">' + commentList[i][2] + '</p>';
                paperCommentList += '<p class="comment-content">' + commentList[i][3] + '</p>';
                paperCommentList += '</div>';
            }

            $('.paper-comments-block').empty().append(paperCommentList);
        }
    }

    function paperDetails(paperDetailsId) {
        var papers = [],
            sessionDesc = [],
            authors = [],
            participants = [],
            tmpParticipants = [],
            paper = "",
            organization = [],
            $paperDetailsBlock = $('.paper-details-block'),
            paperTypes = [];
        if (paperDetailsId) {
            papers = listDBValues('papers', null, 'WHERE id_paper=', paperDetailsId);
            authors = listDBValues('authors', null, 'WHERE paper=', paperDetailsId);
            for (var i = 0, authLen = authors.length; i < authLen; i++) {
                tmpParticipants = listDBValues('participants', null, 'WHERE id_participant=', authors[i][0]);
                participants.push(tmpParticipants);
            }
            participants = compactArray(participants);


            if (papers.length > 0) {

                var $paperToolbar = $('.paper-details-toolbar');
                $('<a href="paper-comments.html?paperId=' + paperDetailsId + '" class="link conference-add-toolbar"><i class="fa fa-comment fa-2x"></i></a>').insertBefore($paperToolbar.find('.paper-details-info'));

                for (var k = 0, paperLen = papers.length; k < paperLen; k++) {
                    paperTypes = listDBValues('paper_types', null, 'WHERE id_paper_type=', papers[k][3]);
                    if (participants.length > 0) {
                        paper += '<a href="#" class="show-paper-authors">Show authors</a>';
                        paper += '<div class="list-block media-list author-list"><ul>';
                        for (var j = 0, particLen = participants.length; j < particLen; j++) {
                            organization = participantOrganization(participants[j]);
                            paper += '<li><a href="speaker.html?speakerId=' + participants[j][0] + '" class="item-link item-content paper-author-details">';
                            paper += '<div class="item-inner"><div class="item-title-row">';
                            paper += '<div class="item-title">' + participants[j][1] + ' ' + participants[j][2] + ' ' + participants[j][3] + '</div>';
                            paper += '</div>';
                            paper += '<div class="item-subtitle">' + participants[j][11];
                            if (organization.length > 0) {
                                paper += '<p class="author-affiliation">Organization: ' + organization[0][1] + '</p>';
                            }
                            paper += '</div>';
                            if (participants[j][6] != "") {
                                paper += '<div class="item-text author-address">Address: ' + participants[j][6] + '<br>';
                            }
                            if (participants[j][10] != "") {
                                paper += 'Phone: ' + participants[j][10] + '<br></div>';
                            }
                            paper += '</div></a></li>';
                        }
                        paper += '</ul></div>';
                    }
                    paper += '<p class="paper-details-name">' + papers[k][1] + '</p>';
                    paper += '<div class="paper-content-basic">';
                    if (paperTypes.length > 0) {
                        paper += '<p class="paper-type-name"><span class="paper-type-label">Paper type:</span> ' + paperTypes[0][1] + '</p>';
                        if (paperTypes[0][2] !== "") {
                            paper += '<p class="paper-type-field"><span class="paper-field-label">Field:</span> ' + paperTypes[0][2] + '</p>';
                        }
                        // if(paper[k][2]!==""){
                        //     paper+='<p class="paper-date-inner">Date '+papers[k][2]+'<p>';
                        // }
                        paper += '<p class="paper-content-inner">' + papers[k][4] + '</p></div>';
                    }
                    $paperDetailsBlock.empty().append(paper).each(setShowAuthors);

                }

            }
        }
    }

    function listPapers(paperId) {
        var papers = [],
            paperDetails = "",
            $paperList = $('.paper-block'),
            authors = [],
            participants = [],
            tmpParticipants = [];
        if (paperId) {
            papers = listDBValues('papers', null, 'WHERE id_paper=', paperId);
            authors = listDBValues('authors', null, 'WHERE paper=', paperId);
            for (var i = 0, authLen = authors.length; i < authLen; i++) {
                tmpParticipants = listDBValues('participants', null, 'WHERE id_participant=', authors[i][0]);
                participants.push(tmpParticipants);
            }
            if (papers.length != 0) {
                $paperList.empty();
                paperDetails += '<div class="content-block-inner paper-block-inner">';
                $.each(papers, function(index, value) {
                    paperDetails += '<p class="paper-title">' + value[1] + '</p>';
                    if (value[2] != "") {
                        paperDetails += '<p class="paper-date">Date: ' + value[2] + '</p>';
                    }
                    if (participants.length > 0) {
                        participants = compactArray(participants);
                        for (var j = 0, particLen = participants.length; j < particLen; j++) {
                            paperDetails += '<p class="paper-author">Author: ' + participants[j][1] + ' ' + participants[j][2] + ', ' + participants[j][3] + '</p>';
                        }

                    }
                    paperDetails += '<a class="button" href="paper-details.html?paperDetailId=' + value[0] + '">Paper info</a>';
                    paperDetails += '</div>';
                });
                $paperList.html(paperDetails);
            }
        }
    }

    function socialEvents(confId) {
        var eventTypes = listDBValues('event_types', null, null),
            events = [],
            $list = $('.social-event-list'),
            content = "",
            session = [],
            location = [],
            tracks = listDBValues('tracks', null, 'WHERE conference=', confId);
        for (var t = 0, tracksLen = tracks.length; t < tracksLen; t++) {
            session.push(listDBValues('sessions', null, 'WHERE tracks=', tracks[t][0]));
        }
        session = compactArray(session);
        for (var i = 0, eventTypeLen = eventTypes.length; i < eventTypeLen; i++) {
            if (eventTypes[i][1].toLowerCase() == 'social') {
                for (var s = 0, sessionLen = session.length; s < sessionLen; s++) {
                    events.push(listDBValues('events', null, 'WHERE event_type=' + "'" + eventTypes[i][0] + "' AND session=", session[s][0]));

                }

            }
        }
        events = compactArray(events);
        if (events.length > 0) {
            $('.social-events-err-block').hide();
            $list.show();
        } else if (events.length == 0) {
            $list.hide();
            $('.social-events-err-block').show();
            return;
        }
        for (var j = 0, eventsLen = events.length; j < eventsLen; j++) {
            session = listDBValues('sessions', null, 'WHERE id_session=', events[j][7]);
            if (session.length > 0) {
                location = listDBValues('locations', null, 'WHERE id_location=', session[0][5]);
            }

            content += '<li><a href="social-map.html?sessionId=' + events[j][7] + '&eventId=' + events[j][0] + '" class="item-link item-content">' +
                '<div class="item-inner"><div class="item-title-row">';
            if (events[j][1] != "") {
                content += '<div class="item-title">' + events[j][1] + '</div></div>';
            }
            if (events[j][3] != "") {
                content += '<div class="item-subtitle"><span class="social-event-time">' + events[j][3].slice(0, -3) + '</span>' + events[j][4] + '</div>';
            }
            if (location.length > 0) {
                content += '<div class="item-text social-loc"><span class="social-location-name">' + location[0][1] + '</span>' + location[0][2] + '</div>';
            }
            if (events[j][2] != "") {
                content += '<div class="item-text">' + events[j][2] + '</div>';
            }
            content += '</div></a></li>';


        }
        $list.append(content);
    }

    function listEvents(sessionId) {
        var eventDetails = "",
            events = listDBValues('events', null, 'WHERE session=', sessionId),
            requiredSession = listDBValues('sessions', ['session_name'], 'WHERE id_session=', sessionId),
            papers = [],
            authors = [];

        $('.session-title-events').html(requiredSession[0][0]);
        if (events.length > 0) {
            $('.event-block').empty();
            $.each(events, function(index, value) {
                var participants = [];
                eventDetails += '<div class="content-block-inner event-block-inner">';
                if (value[1] != "") {
                    eventDetails += '<p class="event-title">' + value[1] + '</p>';
                }
                if (value[5] != "") {
                    papers = listDBValues('papers', null, 'WHERE id_paper=', value[5]);
                    $.each(papers, function(i, paper) {
                        authors = listDBValues('authors', null, 'WHERE paper=', paper[0]);
                    });
                    $.each(authors, function(i, author) {
                        participants.push(listDBValues('participants', null, 'WHERE id_participant=', author[0]));
                    });
                }
                if (participants.length > 0) {
                    participants = compactArray(participants);
                    for (var p = 0, participantLen = participants.length; p < participantLen; p++) {
                        if ((participants[p][1] != "" && participants[p][1] != undefined) && (participants[p][2] != "" && participants[p][2] != undefined)) {
                            eventDetails += '<p class="event-desc">' + participants[p][1] + ' ' + participants[p][2] + '</p>';
                        }
                    }
                }
                eventDetails += '<div class="event-length">';
                if (value[3] != "") {
                    eventDetails += '<span class="event-time">Time: <br>' + value[3].slice(0, -3) + '</span>';
                }
                if (value[4] != "") {
                    eventDetails += '<span class="event-duration">Duration: <br>' + value[4] + '</span>';
                }
                eventDetails += '</div>'
                if (value[5] != "") {
                    eventDetails += '<a class="button event-paper-button" href="paper-details.html?paperId=' + value[5] + '">Papers and authors</a>';
                }
                eventDetails += '</div>';

            });
            $('.event-block').append(eventDetails);
        }

    }

    function scheduleTracks(key) {
        var tracks = [],
            sessions = [],
            sessionsTmp = [],
            sessionStart,
            sessionDay = '',
            location = '',
            chairs = '',
            participants = [],
            $dayInList,
            expandedContent = "",
            trackForSession = [],
            confLogoPath = "",
            conferences = [],
            startDateParse = [],
            endDateParse = [],
            startDate = new Date(),
            endDate = new Date(),
            range1,
            weekday = 0,
            cacheIndicator = false,
            daysInWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        conferences = listDBValues('conferences', ['conference_start_date', 'conference_end_date', 'conference_description'], 'WHERE id_conference=', key);
        $('.main-link-speakers').attr('href', 'speakers.html?confId=' + key);
        $('.main-link-map').attr('href', 'map.html?confId=' + key);
        $('.main-link-social').attr('href', 'social-events.html?confId=' + key);
        if (conferences.length > 0) {
            if (conferences[0][0] != "" && conferences[0][1] != "") {
                startDateParse = conferences[0][0].split(/[- :]/);
                endDateParse = conferences[0][1].split(/[- :]/);
                startDate = new Date(startDateParse[0], startDateParse[1] - 1, startDateParse[2], startDateParse[3], startDateParse[4], startDateParse[5]);
                endDate = new Date(endDateParse[0], endDateParse[1] - 1, endDateParse[2], endDateParse[3], endDateParse[4], endDateParse[5]);
                range1 = moment().range(startDate, endDate);
            }
            if (conferences[0][2] != "") {
                $('.conf-desc-main').empty().html(conferences[0][2]).readmore({
                    maxHeight: 100
                });
            }
        }
        range1.by('days', function(moment) {
            weekday = moment.weekday();
            var dateForDay = moment.format('YYYY-MM-DD');
            $('.day-in-list-' + weekday).find('.schedule-date').empty().html(dateForDay).end().show();
        });
        $('.news-feed-btn').attr('href', 'news.html?conferenceId=' + key);
        $('.conference-addional-title').on('click', function(e) {
            e.preventDefault();
            $('.conference-additional-menu').slideToggle();
        });
        if (key) {
            confLogoPath = listDBValues('conferences', ['conference_logo'], 'WHERE id_conference=', key);
            $('.conf-logo').attr('src', confLogoPath[0][0]);
            cacheItem($('.conf-logo'));
            $('.expand-content').html('<p>No sessions for selected day</p>');

            tracks = listDBValues('tracks', null, 'WHERE conference=', key);
            sessions = listDBValues('sessions', null, null);
            if (tracks.length != 0) {
                for (var i = 0, len = tracks.length; i < len; i++) {
                    var sessionsForTrack = listDBValues('sessions', null, 'WHERE tracks=', tracks[i][0]);
                    if (sessionsForTrack.length != 0) {
                        sessionsTmp.push(sessionsForTrack);
                    }

                }
            }
            sessions = compactArray(sessionsTmp);
            sessions.sort(function(a, b) {
                var timeFirst = moment('1970/01/01 ' + a[3]),
                    timeSecond = moment('1970/01/01 ' + b[3]);
                if (timeFirst.diff(timeSecond) == 0) {
                    if (a[1] < b[1]) return -1;
                    if (a[1] > b[1]) return 1;
                    return 0;
                }
                return new Date('1970/01/01 ' + a[3]) - new Date('1970/01/01 ' + b[3]);
            });
            if (sessions.length != 0) {
                if (!$.isEmptyObject(globalScheduleBlock)) {
                    // console.log(globalScheduleBlock);
                    for (var i in globalScheduleBlock) {
                        if (globalScheduleBlock.hasOwnProperty(i)) {
                            if ($('#' + i).hasClass('clean')) {
                                $('#' + i).removeClass('clean').empty();
                            }
                            $('#' + i).append(globalScheduleBlock[i]).addClass('clean');
                        }
                    }
                    for (var j = 0, sesLen = sessions.length; j < sesLen; j++) {
                        sessionStart = new Date(sessions[j][2]);
                        sessionDay = sessionStart.getUTCDay();;
                        $('.day-of-week-' + sessionDay).addClass('has-content');
                    }
                    return;
                }
                for (var j = 0, sesLen = sessions.length; j < sesLen; j++) {
                    sessionStart = new Date(sessions[j][2]);
                    sessionDay = sessionStart.getUTCDay();
                    location = [];
                    chairs = [];
                    participants = [];

                    $dayInList = $('#day-expanded-' + sessionDay);
                    $('.day-of-week-' + sessionDay).addClass('has-content');
                    if ($dayInList.hasClass('clean')) {
                        $dayInList.removeClass('clean').empty();
                    }

                    location = listDBValues('locations', null, 'WHERE id_location=', sessions[j][5]);
                    chairs = listDBValues('chairs', null, 'WHERE sessions_chair=', sessions[j][0]);

                    if (chairs.length > 0) {
                        for (var k = 0, chairLen = chairs.length; k < chairLen; k++) {
                            participants = listDBValues('participants', null, 'WHERE id_participant=', chairs[k][0]);
                        }
                    }


                    expandedContent = '<div class="main-content-expanded">' +
                        '<div class="session-info">' +
                        '<li class="session-title">' + sessions[j][1] + '</li>';
                    if (location.length > 0) {
                        expandedContent += '<li class="session-loc">' + location[0][1];
                        if (location[0][2] != "") {
                            expandedContent += ' ' + location[0][2] + '</li>';
                        } else {
                            expandedContent += '</li>';
                        }

                        if (sessions[j][3] != "") {
                            expandedContent += '<li class="session-time">' + sessions[j][3].slice(0, -3) + '</li>';
                        }

                    }

                    if (participants.length > 0) {
                        expandedContent += '';
                        // '<ul class="chair-list">';
                        for (var g = 0, partLen = participants.length; g < partLen; g++) {

                            expandedContent += '<li class="chair-name">' + participants[g][1] + ' ' + participants[g][2] + ', ' + participants[g][3] + '</li>';
                        }
                    }
                    if (tracks.length != 0) {

                        for (var t = 0, trackLen = tracks.length; t < trackLen; t++) {

                            if (tracks[t][0] == sessions[j][4]) {

                                expandedContent += '<li class="track-name">' + tracks[t][1] + '</li>';
                            }

                        }
                    }

                    expandedContent += '<a href="event-list.html?eventId=' + sessions[j][0] + '" class="button session-details">Details</a></div></div>';
                    $dayInList.append(expandedContent);
                    if (globalScheduleBlock['day-expanded-' + sessionDay]) {
                        globalScheduleBlock['day-expanded-' + sessionDay] += expandedContent;
                    } else {
                        globalScheduleBlock['day-expanded-' + sessionDay] = expandedContent;
                    }

                }
                $dayInList.addClass('clean');

            }


        } else {
            myApp.alert('Unfortunately, required data could not be loaded', 'Critical error', function() {

            });
        }
    }

    function listConferences(value) {
        var today = new Date();
        var dd = today.getUTCDate();
        var mm = today.getUTCMonth() + 1;
        var yyyy = today.getUTCFullYear();
        if (dd < 10) {
            dd = '0' + dd;
        }
        if (mm < 10) {
            mm = '0' + mm;
        }

        today = yyyy + '-' + mm + '-' + dd;
        var todayFormatted = new Date(today);

        for (var i = 0, len = value.length; i < len; i++) {
            if (value[i].length != 0) {
                var startDateParse = value[i][6].split(/[- :]/),
                    endDateParse = value[i][7].split(/[- :]/),
                    startDateFormatted = new Date(startDateParse[0], startDateParse[1] - 1, startDateParse[2], startDateParse[3], startDateParse[4], startDateParse[5]),
                    endDateFormatted = new Date(endDateParse[0], endDateParse[1] - 1, endDateParse[2], endDateParse[3], endDateParse[4], endDateParse[5]);
                if ((todayFormatted <= endDateFormatted && todayFormatted >= endDateFormatted) || todayFormatted < startDateFormatted) {
                    $('.next-error-title').hide();
                    $('.next-title').show();
                    $('.next-list').show().append('<li><a href="schedule.html?conferenceId=' + value[i][0] + '"  class="item-link item-content conference-main-link" href="#"><div class="item-media"></div><div class="item-inner"><div class="item-title-row"><div class="item-title">' + value[i][3] + '</div></div><div class="item-subtitle">Starts at: ' + moment(value[i][6]).format('YYYY-MM-DD') + '<br>Ends at: ' + moment(value[i][7]).format('YYYY-MM-DD') + '</div></div></a></li>');
                } else if (todayFormatted > endDateFormatted) {
                    $('.previous-error-title').hide();
                    $('.previous-title').show();
                    $('.previous-list').show().append('<li><a href="schedule.html?conferenceId=' + value[i][0] + '"  class="item-link item-content conference-main-link" href="#"><div class="item-media"></div><div class="item-inner"><div class="item-title-row"><div class="item-title">' + value[i][3] + '</div></div><div class="item-subtitle">Starts at: ' + moment(value[i][6]).format('YYYY-MM-DD') + '<br>Ends at: ' + moment(value[i][7]).format('YYYY-MM-DD') + '</div></div></a></li>');
                }
            }
        }
    }
    $(document).on('click', '.action2', function() {
        var day = $(this).data('day'),
            $dayExpanded = $('#day-expanded-' + day);
        $('.expand-content').slideUp();
        if ($dayExpanded.css('display') == 'none') {
            $dayExpanded.slideDown(400);
        } else {
            $dayExpanded.slideUp(400);
        }

    });

    function updateCatalogs() {
        var catalogTypes = listDBValues('updated_catalogs', null, null),
            data = {
                method: 'updateCatalog',
            },
            value;
        for (var i = 0, catalogLen = catalogTypes.length; i < catalogLen; i++) {
            data.catalogName = catalogTypes[i][0];
            data.timestamp = catalogTypes[i][1];
            ajaxRequest('catalog_update.php', data).done(function(response) {
                value = response.data;

                if (value.participant_types != null) {
                    if (value.participant_types.length > 0) {
                        for (var j = 0, partTypeLen = value.participant_types.length; j < partTypeLen; j++) {
                            updateValue('participant_types', ['participant_type_name', 'created_at', 'deleted_at'], [value.participant_types[j].name, value.participant_types[j].created, value.participant_types[j].deleted], 'WHERE id_participant_type=', value.participant_types[j].id_participant_type);
                            updateValue('updated_catalogs', ['timestamp'], [response.timeStamp], 'WHERE catalog_name=', 'participant_types');
                        }
                    }


                }
                if (value.paper_types != null) {
                    if (value.paper_types.length > 0) {
                        for (var k = 0, paperTypeLen = value.paper_types.length; k < paperTypeLen; k++) {
                            updateValue('paper_types', ['paper_type_name', 'paper_type_field', 'created_at', 'deleted_at'], [value.paper_types[k].name, value.paper_types[k].field, value.paper_types[k].created, value.paper_types[k].deleted], 'WHERE id_paper_type=', value.paper_types[k].id_paper_type);
                            updateValue('updated_catalogs', ['timestamp'], [response.timeStamp], 'WHERE catalog_name=', 'paper_types');
                        }
                    }

                }
                if (value.event_types != null) {
                    if (value.event_types.length > 0) {
                        for (var g = 0, eventTypeLen = value.event_types.length; g < eventTypeLen; g++) {
                            updateValue('event_types', ['event_type_name', 'event_type_field', 'created_at', 'deleted_at'], [value.event_types[g].name, value.event_types[g].type, value.event_types[g].created, value.event_types[g].deleted], 'WHERE id_event_type=', value.event_types[g].id_event_type);
                            updateValue('updated_catalogs', ['timestamp'], [response.timeStamp], 'WHERE catalog_name=', 'event_types');
                        }
                    }

                }
            });
        }
    }

    function updateConferences() {
        var data = {
                method: 'updateConference'
            },
            conferences = listDBValues('conferences', null, null),
            dateParse = [],
            updatedDate = '';
        if (conferences.length == 0) {
            return;
        }
        for (var i = 0, confLen = conferences.length; i < confLen; i++) {
            data.conferenceId = conferences[i][0];
            dateParse = conferences[i][12].split(/[- :]/);
            data.timestamp = new Date(dateParse[0], dateParse[1] - 1, dateParse[2], dateParse[3], dateParse[4], dateParse[5]).getTime() / 1000;
            (function(i) {
                ajaxRequest('conference_update.php', data).done(function(response) {
                    $.each(response.data, function(index, arr) {
                        if (arr != null) {
                            if (arr.length > 0) {
                                myApp.addNotification({
                                    title: 'Updates available',
                                    message: 'Application will apply updates. Experience may vary.'
                                });
                                updatedDate = moment(response.timeStamp * 1000).format('YYYY-MM-DD HH:mm:ss');
                                updateValue('conferences', ['updated_at'], [updatedDate], 'WHERE id_conference=', conferences[i][0]);
                                switch (index) {
                                    case 'conference':
                                        $(arr).each(function(i, value) {
                                            updateValue('conferences', ['conference_name', 'conference_key', 'conference_abbreviation', 'conference_description', 'conference_logo', 'conference_start_date', 'conference_end_date', 'conference_url', 'conference_pol_lat', 'conference_pol_lng', 'created_at', 'updated_at', 'deleted_at', 'about', 'contact'], [value.name, value.key, value.abb, value.description, value.logo, value.starts, value.ends, value.url, value.lat, value.lng, value.created, value.updated, value.deleted, value.about, value.contact], 'WHERE id_conference=', value.id_conference);
                                        });
                                        break;
                                    case 'news':
                                        $(arr).each(function(i, value) {
                                            updateValue('news', ['conference', 'news_heading', 'news_time', 'news_content', 'news_url', 'created_at', 'updated_at', 'deleted_at'], [value.id_conference, value.heading, value.time, value.content, value.url, value.created, value.updated, value.deleted], 'WHERE id_news=', value.id_news);
                                        });
                                        break;
                                    case 'locations':
                                        $(arr).each(function(i, value) {
                                            updateValue('locations', ['location_name', 'location_address', 'location_capacity', 'location_description', 'location_picture', 'conference', 'lat', 'lng', 'created_at', 'updated_at', 'deleted_at'], [value.name, value.address, value.capacity, value.description, value.picture, value.conference, value.lat, value.lng, value.created, value.update, value.deleted], 'WHERE id_location=', value.id_location);
                                        });
                                        break;
                                    case 'tracks':
                                        $(arr).each(function(i, value) {
                                            updateValue('tracks', ['track_name', 'track_description', 'conference', 'created_at', 'updated_at', 'deleted_at'], [value.name, value.description, parseInt(value.conference, 10), value.created, value.update, value.deleted], 'WHERE id_track=', value.id_track);
                                        });
                                        break;
                                    case 'sessions':
                                        $(arr).each(function(i, value) {
                                            updateValue('sessions', ['session_name', 'session_date', 'session_time', 'tracks', 'location', 'created_at', 'updated_at', 'deleted_at'], [value.name, value.date, value.time, value.track, value.location, value.created, value.update, value.deleted], 'WHERE id_session=', value.id_session);
                                        });
                                        break;
                                    case 'chair':
                                        $(arr).each(function(i, value) {
                                            updateValue('chairs', ['participant_chair', 'sessions_chair', 'created_at', 'updated_at', 'deleted_at'], [parseInt(value.id_chair_participant, 10), parseInt(value.id_chair_session, 10), value.created, value.update, value.deleted], 'WHERE id_chair=', value.id_chair);
                                        });
                                        break;
                                    case 'authors':
                                        $(arr).each(function(i, value) {
                                            updateValue('authors', ['participant_paper', 'paper', 'author_picture text', 'created_at', 'updated_at', 'deleted_at'], [parseInt(value.id_participant, 10), parseInt(value.id_paper, 10), value.picture, value.created, value.updated, value.deleted], 'WHERE id_author=', value.id_author);
                                        });
                                        break;
                                    case 'participants':
                                        $(arr).each(function(i, value) {
                                            updateValue('participants', ['participant_name', 'participant_surname', 'participant_academic_title', 'participiant_picture', 'participiant_field', 'participant_address', 'participant_city', 'participant_country', 'participant_zip_code', 'participant_phone', 'participant_email', 'participiant_biography', 'organization', 'conference', 'created_at', 'updated_at', 'deleted_at'], [value.name, value.surname, value.title, value.picture, value.field, value.address, value.city, value.country, value.zip, value.phone, value.email, value.biography, value.organization, value.conference, value.created, value.updated, value.deleted], 'WHERE id_participant=', parseInt(value.id_participant, 10));
                                        });
                                        break;
                                    case 'roles':
                                        $(arr).each(function(i, value) {
                                            updateValue('participants_roles', ['id_role', 'participants_id', 'participant_type_id', 'created_at', 'updated_at', 'deleted_at'], [parseInt(value.roles_id, 10), parseInt(value.participant_id, 10), parseInt(value.participant_types_id, 10)], "WHERE id_role=", value.roles_id);
                                        });
                                        break;
                                    case 'organizations':
                                        $(arr).each(function(i, value) {
                                            updateValue('organizations', ['organization_name', 'organization_zip', 'organization_address', 'organization_phone', 'organization_city', 'organization_country', 'organization_email', 'organization_VAT', 'organization_url', 'created_at', 'updated_at', 'deleted_at'], [value.name, value.zip, value.address, value.phone, value.city, value.country, value.email, value.VAT, value.url, value.created, value.updated, value.deleted], 'WHERE id_organization=', value.id_organization);
                                        });
                                        break;
                                    case 'events':
                                        $(arr).each(function(i, value) {
                                            updateValue('events', ['event_name', 'event_description', 'event_time', 'event_duration_min', 'paper', 'event_type', 'session', 'created_at', 'updated_at', 'deleted_at'], [value.name, value.description, value.time, value.duration, value.paper, value.type, value.session, value.created, value.updated, value.deleted], 'WHERE id_event=', value.id_event);
                                        });
                                        break;
                                    case 'papers':
                                        $(arr).each(function(i, value) {
                                            updateValue('papers', ['paper_name', 'paper_date', 'paper_type', 'paper_summary', 'track', 'created_at', 'updated_at', 'deleted_at'], [value.paper_name, value.date, value.type, value.summary, value.track, value.created, value.updated, value.deleted], 'WHERE id_paper=', value.id_paper);
                                        });
                                        break;
                                }
                            }
                        }
                    });
                });
            }(i));
        }
    }
    (function() {
        try {
            var listConferences = listDBValues('conferences', null, null);
            if (listConferences.length > 0) {
                updateCatalogs();
                updateConferences();
            }
        } catch (e) {
            //sutnja je zlato
        }

    }());


    (function() {
        // window.localStorage.removeItem('confbox.sqlite');

        var tableList = createTables(),
            conferenceList = [];
        ImgCache.options.debug = true;
        ImgCache.options.chromeQuota = 50 * 1024 * 1024;
        ImgCache.init();
        if (tableList.length != 0) {
            conferenceList = listDBValues('conferences', null, null);
            if (conferenceList.length != 0) {
                if (!$('.conf-main-link').hasClass('link-to-conferences')) {
                    $('.conf-main-link').addClass('link-to-conferences');
                    // $('.link-to-conferences').css('color', 'black');
                    // $('.conferences-icon').css('color', 'black');
                }
                $(mainView.loadPage('conference-list.html'));
            } else {
                // $('.link-to-conferences').css('color', '#969696');
                // $('.conferences-icon').css('color', '#969696');
                $('.conf-main-link').removeClass('link-to-conferences');
                $(mainView.loadPage('add-conference.html'));
                myApp.onPageInit('add-conference', function(e) {
                    handleSubmit('.button-submit');
                });
            }
        }

    }());
// });
}, false);

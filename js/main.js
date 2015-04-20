$(document).ready(function () {
    var flag = 0;
    var map;
    var locationsArray = [];
    var geocoder = new google.maps.Geocoder();
    var delay = 100;
    var locality;
    var infoWindow = new google.maps.InfoWindow();
    var routePath;

    function locations() {
        this.hintNumber = null;
        this.address = null;
        this.geocode = null;
        this.marker = null;
        this.contentString = null;
    }

    function initialize() {
        var mapOptions = {
            zoom: 16
            //mapTypeId: google.maps.MapTypeId.TERRAIN
        };
        map = new google.maps.Map(document.getElementById('map-canvas'),
        mapOptions);

        // Try HTML5 geolocation
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(function (position) {
                var pos = new google.maps.LatLng(position.coords.latitude,
                position.coords.longitude);
                findCity(pos);
                map.setCenter(pos);
                // Adds a marker at the center of the map.
                var marker = addMarker(pos);
                google.maps.event.addListener(marker, 'click', function () {
                    var infowindow = new google.maps.InfoWindow({
                        map: map,
                        position: pos,
                        content: 'Your starting location.'
                    });
                });
            }, function () {
                handleNoGeolocation(true);
            });
        } else {
            // Browser doesn't support Geolocation
            handleNoGeolocation(false);
        }
    }

    function handleNoGeolocation(errorFlag) {
        if (errorFlag) {
            var content = 'Error: The Geolocation service failed.';
        } else {
            var content = 'Error: Your browser doesn\'t support geolocation.';
        }

        var options = {
            map: map,
            position: new google.maps.LatLng(32.714585, -117.169280),
            content: content
        };

        var infowindow = new google.maps.InfoWindow(options);
        map.setCenter(options.position);
    }

    // Function that is needed to identify the locality for Geocoding
    function findCity(pos) {
        geocoder.geocode({
            'latLng': pos
        }, function (results, status) {
            if (status == google.maps.GeocoderStatus.OK) {
                if (results[1]) {
                    //find name
                    for (var i = 0; i < results[0].address_components.length; i++) {
                        for (var b = 0; b < results[0].address_components[i].types.length; b++) {
                            //there are different types that might hold a city locality usually does
                            if (results[0].address_components[i].types[b] == "locality") {
                                //this is the object you are looking for
                                locality = results[0].address_components[i].long_name;
                            }
                        }
                    }
                } else {
                    alert("No results found");
                }
            } else {
                alert("Geocoder failed due to: " + status);
            }
        });
    }   

    // Add a marker to the map.
    function addMarker(coords) {
        var marker = new google.maps.Marker({
            position: coords,
            draggable: true,
            map: map,
        });

        // Update Route and address if marker is moved.
        google.maps.event.addListener(marker, 'dragend', function(event) {
            getGeocodeAddress(updateLocationArray, marker);
            updateRoutePath();
        });
        return marker;
    }

    // Deletes marker from map.
    function deleteMarker(hintNumber) {
        for (var i = 0; i < locationsArray.length; i++) {
            if (locationsArray[i].hintNumber == hintNumber){
                locationsArray[i].marker.setMap(null);
            }
        }
    }

    // Update locationsArray object with new address, pos, and list
    function updateLocationArray(route, streetNumber, marker) {
        for (var i = locationsArray.length-1; i>=0; i--){
            if (locationsArray[i].marker.title == marker.title) {
                locationsArray[i].address = streetNumber + " " + route;
                locationsArray[i].marker = marker;
                locationsArray[i].geocode = marker.position;
                $("#hint"+ locationsArray[i].hintNumber).html('#'+locationsArray[i].hintNumber + ': ' + locationsArray[i].address);
            }
        }
    }

    // Get Address from Geocode.
    function getGeocodeAddress(callback, marker) {
        var route = null;
        var streetNumber = null;

        geocoder.geocode({
            latLng: marker.position
        }, function (results, status) {
            if (status == google.maps.GeocoderStatus.OK) {
                if (results[1]) {
                    //find route name
                    for (var i = 0; i < results[0].address_components.length; i++) {
                        for (var b = 0; b < results[0].address_components[i].types.length; b++) {
                            //there are different types that might hold a route usually does
                            if (results[0].address_components[i].types[b] == "route") {
                                //this is the object you are looking for
                                route = results[0].address_components[i].long_name;
                            }
                        }
                    }
                    //find street_number name
                    for (var j = 0; j < results[0].address_components.length; j++) {
                        for (var a = 0; a < results[0].address_components[j].types.length; a++) {
                            //there are different types that might hold a StreetNumber usually does
                            if (results[0].address_components[j].types[a] == "street_number") {
                                //this is the object you are looking for
                                streetNumber = results[0].address_components[j].long_name;
                            }
                        }
                    }
                } else {
                    alert("No results found");
                }
                callback(route, streetNumber, marker);
            } else {
                alert("Geocoder failed due to: " + status);
            }
        });
    }

    // Creates the info window for the marker on the map
    function createInfoWindow(marker, content) {
        google.maps.event.addListener(marker, 'click', function () {
            infoWindow.setContent(content);
            infoWindow.open(map, this);
        });
    }

    // Gets the geocode for the address
    function getGeocode(callback, location) {
        geocoder.geocode({'address': location.address, componentRestrictions: {'locality': locality}}, function (results, status) {
            if (status == google.maps.GeocoderStatus.OK) {
                var result = results[0].geometry.location
                callback(result, location);
            } else {
                alert('Geocode was not successful for the following reason: ' + status);
            }
        });
    }

    //create location object, add info
    function createLocation(txtVal, txtNumVal){
        var location = new locations();
        location.address = txtVal;
        location.hintNumber = parseInt(txtNumVal);
        location.contentString = "Hint #" + (location.hintNumber);

        // Get the Geocode for the location
        getGeocode(createLocationMarker, location);
    }

    // add geocode data and create and add marker and add info window
    function createLocationMarker(geocode, location){
        location.geocode = geocode;
        location.marker = addMarker(location.geocode);
        location.marker.title = location.hintNumber;

        // Create the necessary info window for the marker
        createInfoWindow(location.marker, location.contentString);

        // add new location object to location array
        locationsArray.push(location);

        // Update the Route Path
        updateRoutePath();
    }

    // Function to add the Route Path to the map.
    function getRoutePath() {
        var path = [];
        // Iterate over locationsArray markers to add latlng to path array.
        for (var i = 0; i < locationsArray.length; ++i) {
            path.push(locationsArray[i].marker.position);
        }
        
        // Create polylines.
        var routePath = new google.maps.Polyline({
            path: path,
            strokeColor: '#FF0000',
            strokeOpacity: 1.0,
            strokeWeight: 1,
            geodesic: true
        });
        return routePath;
    }

    // Update the Route Path
    function updateRoutePath() {
        if (routePath) {
            routePath.setMap(null);
        }
        routePath = getRoutePath();
        routePath.setMap(map);
    }
/*
    // Use this to add distance calculation to application if needed.
    function updateDisplay() {
        var total_distance_m = 1000 * routePath.inKm();
        var dist = unit_handler.f(total_distance_m);
        document.getElementById("distance").value = dist.toFixed(3);
    }
*/

// Start the program
    google.maps.event.addDomListener(window, 'load', initialize);


    // use enter to add list items
    $('#new-hint-item').keyup(function (event) {
        if (event.keyCode == 13) {
            event.preventDefault();
            $('#add').click();
        }
    });

    //add list items
    $('#add').on('click', function () {
        var $txtNumBox = $('#new-hint-number');
        var $txtBox = $('#new-hint-item');
        var txtVal = $txtBox.val();
        var txtNumVal = $txtNumBox.val();
        event.preventDefault();

        if (!$.trim(txtVal)) {
            alert('Please enter a location to add to the list.');
        }else if($.trim(txtVal)=='no'){
            // This represents no action taken for the user. These hints are randoms to be completed as the racer is moving between the other locations.
            $('<li class="items" id="' + txtNumVal + '"></li>').appendTo('#list').html('<p id="hint' + txtNumVal + '">#'+ txtNumVal + ': ' + txtVal + '</p><img class="check-mark" src="img/check_mark2.png"><img class="delete" src="img/delete.png">');
            $txtBox.val('');
            $txtNumBox.val('');
        } else {
            // Start the process of creating the Location object with the user's entry.
            createLocation(txtVal, txtNumVal);

            // Add li element to page and clear text boxes for next entry by user.
            $('<li class="items" id="' + txtNumVal + '"></li>').appendTo('#list').html('<p id="hint' + txtNumVal + '">#'+ txtNumVal + ': ' + txtVal + '</p><img class="check-mark" src="img/check_mark2.png"><img class="delete" src="img/delete.png">');
            $txtBox.val('');
            $txtNumBox.val('');
        }
    });

    // Ensure that the new-hint-number is a number
    $("#new-hint-number").keydown(function (e) {
        // Allow: backspace, delete, tab, escape, enter and .
        if ($.inArray(e.keyCode, [46, 8, 9, 27, 13, 110, 190]) !== -1 ||
             // Allow: Ctrl+A
            (e.keyCode == 65 && e.ctrlKey === true) ||
             // Allow: Ctrl+C
            (e.keyCode == 67 && e.ctrlKey === true) ||
             // Allow: Ctrl+X
            (e.keyCode == 88 && e.ctrlKey === true) ||
             // Allow: home, end, left, right
            (e.keyCode >= 35 && e.keyCode <= 39)) {
                 // let it happen, don't do anything
                 return;
        }
        // Ensure that it is a number and stop the keypress
        if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
            e.preventDefault();
        }
    });

    // click to show delete button and style to show item emphasis
    $("#list").on('click', 'li', function () {
        $(this).find("p").toggleClass("listHover");
        $(this).find(".delete").toggleClass("deleteShow");
    });

    // hover to show item emphasis
    $("#list").on('mouseover', '.delete', function () {
        $(this).toggleClass("listHover");
    });
    $("#list").on('mouseleave', '.delete', function () {
        $(this).removeClass("listHover");
    });
    // hover to show item emphasis
    $("#list").on('mouseover', '.check-mark', function () {
        $(this).toggleClass("listHover");
    });
    $("#list").on('mouseleave', '.check-mark', function () {
        $(this).removeClass("listHover");
    });

    // Mark item as completed
    $("#list").on('click', '.check-mark', function () {
        $(this).parent().find("p").toggleClass("completed");
        $(this).parent().find(".check-mark").toggleClass("completed");
        $(this).parent().find(".check-mark").toggleClass("listHover");
    });

    // Remove the hint from the list and locationsArray
    $("#list").on('click', '.delete', function () {
        //remove from locationarray and markers arrays and from map
        var hintDelNumber = $(this).parent().text();
        hintDelNumber = hintDelNumber.substr(1, hintDelNumber.indexOf(':') - 1);

        // Delete marker from map
        deleteMarker(hintDelNumber);

        // Delete location object from locationarray
        for (var i = locationsArray.length-1; i>=0; i--){
            if (locationsArray[i].hintNumber == hintDelNumber) {
                locationsArray.splice(i, 1);
            }
        }

        // Remake Arrays to remove the "undefined" that splice leaves
        locationsArray = locationsArray.filter(function(n){ return n != undefined });

        // Update the Route Path
        updateRoutePath();

        $(this).parent().remove();
    });

    //sortable list items
    $('#list').sortable({
        axis: "y",
        update: function(event, ui){
            // Retrieves list of item IDs in order and convert to int
            var newOrder = $(this).sortable('toArray').map(function(i){return parseInt(i, 10);});
            // Update the locationsArray
            updateArrayOrder(newOrder);
            // Update the Route Path
            updateRoutePath();
        }
    });

    // Update the locationsArray after new user sort.
    function updateArrayOrder(newOrder){
        // Iterate through each item in the neworder array
        locationsArray.sort(function (a, b) {
            return newOrder.indexOf(a.hintNumber) < newOrder.indexOf(b.hintNumber) ? -1 : 1;
        });
    }
});
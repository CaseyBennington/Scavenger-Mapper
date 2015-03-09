$(document).ready(function () {
    var flag = 0;
    var map;
    var markers=[];
    var locations = [];
    var geocoder = new google.maps.Geocoder();
    var delay = 100;
    var locality;

/*
    function markLocations(addresses) {
        var contentString;
        $.each(addresses, function(i, val) {
            $.getJSON('http://maps.googleapis.com/maps/api/geocode/json?address=' + val + '&components=locality:SanDeigo&sensor=false', null, function (data) {
                var p = data.results[0].geometry.location;
                var latlng = new google.maps.LatLng(p.lat, p.lng);
                var marker = new google.maps.Marker({
                    position: latlng,
                    map: map
                });
                contentString="Hint #"+(i+1);
		        google.maps.event.addListener(marker, 'click', function () {
			        	var infowindow = new google.maps.InfoWindow({
	                    map: map,
	                    position: latlng,
	                    content: contentString
                	});
		        });
            });
        });
    }

*/
    function markLocations(addresses, locality) {
        var contentString;
        $.each(addresses, function (i, val) {

            geocoder.geocode({'address': val, componentRestrictions: {'locality': locality}}, function (results, status) {
                if (status == google.maps.GeocoderStatus.OK) {
                    var locationPostion=results[0].geometry.location;
                    var marker=addMarker(locationPostion);
                    contentString = "Hint #" + (i + 1);
                    google.maps.event.addListener(marker, 'click', function () {
                        var infowindow = new google.maps.InfoWindow({
                            map: map,
                            draggable: true,
                            position: locationPostion,
                            content: contentString
                        });
                    });
                } else {
                    alert('Geocode was not successful for the following reason: ' + status);
                }
            });
        });
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

                var infowindow = new google.maps.InfoWindow({
                    map: map,
                    position: pos,
                    content: 'Location found using HTML5.'
                });

                map.setCenter(pos);
            }, function () {
                handleNoGeolocation(true);
            });
        } else {
            // Browser doesn't support Geolocation
            handleNoGeolocation(false);
        }

        // This event listener will call addMarker() when the map is clicked.
        google.maps.event.addListener(map, 'click', function (event) {
            addMarker(event.latLng);
        });

        // Adds a marker at the center of the map.
        addMarker(pos);
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

      function findCity(pos) {
          geocoder.geocode({
              'latLng': pos
          }, function (results, status) {
              if (status == google.maps.GeocoderStatus.OK) {
                  console.log(results);
                  if (results[1]) {
                      //formatted address
                      alert(results[0].formatted_address);
                      //find country name
                      for (var i = 0; i < results[0].address_components.length; i++) {
                          for (var b = 0; b < results[0].address_components[i].types.length; b++) {
                              //there are different types that might hold a city locality usually does
                              if (results[0].address_components[i].types[b] == "locality") {
                                  //this is the object you are looking for
                                  locality = results[0].address_components[i];
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














    // Add a marker to the map and push to the array.
    function addMarker(location) {
        var marker = new google.maps.Marker({
            position: location,
            map: map
        });
        markers.push(marker);
        return marker;
    }

    // Deletes all markers in the array by removing references to them.
    function deleteMarkers() {
        for (var i = 0; i < markers.length; i++) {
            markers[i].setMap(null);
        }
        markers = [];
    }

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
        var $txtBox = $('#new-hint-item');
        var txtVal = $txtBox.val();
        event.preventDefault();

        if (!$.trim($('#new-hint-item').val())) {
            alert('Please enter a location to add to the list.');
        } else {
            //add hint to array
            locations.push(txtVal);
            //change hints array to coordinates and add to map
            markLocations(locations, locality);

            $('<li class="items"></li>').appendTo('#list').html('<p>' + txtVal + '</p><img class="check-mark" src="img/check_mark2.png"><img class="delete" src="img/delete.png">');
            $txtBox.val('');
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

    // mark as completed
    $("#list").on('click', '.check-mark', function () {
        $(this).parent().find("p").toggleClass("completed");
        $(this).parent().find(".check-mark").toggleClass("completed");
        $(this).parent().find(".check-mark").toggleClass("listHover");
    });

    // remove list item
    $("#list").on('click', '.delete', function () {
        //remove from array and from map
        var hintRemove = $(this).parent().text();
        locations.splice($.inArray(hintRemove, locations), 1);
        deleteMarkers();
        markLocations(locations, locality);

        $(this).parent().remove();
    });

    //sortable list items
    $('#list').sortable({
        axis: "y"
    });
});
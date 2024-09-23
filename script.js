tt.setProductInfo("Solera-tomtom-test", "1.0.0");

// ***** create goal location & routes to this point ***** //
const passengerInitCoordinates = [4.886348, 52.358990];

// ***** Initialize the map with your TomTom API Key ***** //
const apiKey = "2QGObnyt2LGwgaoPDcZmyQVf1fxxYGfq";
const map = tt.map({
    key: apiKey,
    container: 'map', // ID of the div where the map will be rendered
    // center: [4.876935, 52.360306], // Initial map center (longitude, latitude) this one is Amsterdam
    center: passengerInitCoordinates,
    zoom: 13, // Initial zoom level
    style: "https://api.tomtom.com/style/2/custom/style/dG9tdG9tQEBAZVZsdVNMSU5HYkY0dWhZZztkZjEwZjQyOS0wOGIwLTQxMzgtYWM2Yy1iYWMxMjU4MzVjZGQ=.json?key=2QGObnyt2LGwgaoPDcZmyQVf1fxxYGfq"  // Use valid JSON style URL
});

// ***** Add zoom and rotation controls ***** //
const ttZoomControls = new tt.plugins.ZoomControls({
    className: 'my-class-name', // default = ''
    animate: false // default = true
});
map.addControl(new tt.FullscreenControl());
map.addControl(new tt.NavigationControl());
map.addControl(ttZoomControls, 'bottom-right');

// ***** ADD SEARCHBOX ***** //
const options = {
    searchOptions: {
    key: apiKey,
    language: "en-GB",
    limit: 5,
    },
    autocompleteOptions: {
    key: apiKey,
    language: "en-GB",
    },
};  

var ttSearchBox = new tt.plugins.SearchBox(tt.services, options);
var searchMarkersManager = new SearchMarkersManager(map);
ttSearchBox.on("tomtom.searchbox.resultsfound", handleResultsFound);
ttSearchBox.on("tomtom.searchbox.resultselected", handleResultSelection);
ttSearchBox.on("tomtom.searchbox.resultfocused", handleResultSelection);
ttSearchBox.on("tomtom.searchbox.resultscleared", handleResultClearing);
map.addControl(ttSearchBox, "top-left");

ttSearchBox.updateOptions({
    minNumberOfCharacters: 5,
    showSearchButton: false,
    labels: {
      placeholder: "Search location",
    },
});

function handleResultsFound(event) {
    var results = event.data.results.fuzzySearch.results;

    if (results.length === 0) {
      searchMarkersManager.clear();
    }
    searchMarkersManager.draw(results);
    fitToViewport(results);
}
  
function handleResultSelection(event) {
    var result = event.data.result;
    if (result.type === "category" || result.type === "brand") {
      return;
    }
    searchMarkersManager.draw([result]);
    fitToViewport(result);
}
  
function fitToViewport(markerData) {
    if (!markerData || (markerData instanceof Array && !markerData.length)) {
      return;
    }
    var bounds = new tt.LngLatBounds();
    if (markerData instanceof Array) {
      markerData.forEach(function (marker) {
        bounds.extend(getBounds(marker));
      });
    } else {
      bounds.extend(getBounds(markerData));
    }
    map.fitBounds(bounds, { padding: 100, linear: true });
}
  
function getBounds(data) {
    var btmRight;
    var topLeft;
    if (data.viewport) {
      btmRight = [
        data.viewport.btmRightPoint.lng,
        data.viewport.btmRightPoint.lat,
      ];
      topLeft = [data.viewport.topLeftPoint.lng, data.viewport.topLeftPoint.lat];
    }
    return [btmRight, topLeft];
}
  
function handleResultClearing() {
    searchMarkersManager.clear();
}

function SearchMarkersManager(map, options) {
    this.map = map;
    this._options = options || {};
    this._poiList = undefined;
    this.markers = {};
}
  
SearchMarkersManager.prototype.draw = function (poiList) {
    this._poiList = poiList;
    this.clear();
    this._poiList.forEach(function (poi) {
      var markerId = poi.id;
      var poiOpts = {
        name: poi.poi ? poi.poi.name : undefined,
        address: poi.address ? poi.address.freeformAddress : "",
        distance: poi.dist,
        classification: poi.poi ? poi.poi.classifications[0].code : undefined,
        position: poi.position,
        entryPoints: poi.entryPoints,
      };
      var marker = new SearchMarker(poiOpts, this._options);
      marker.addTo(this.map);
      this.markers[markerId] = marker;
    }, this);
};
  
SearchMarkersManager.prototype.clear = function () {
    for (var markerId in this.markers) {
      var marker = this.markers[markerId];
      marker.remove();
    }
    this.markers = {};
    this._lastClickedMarker = null;
};

function SearchMarker(poiData, options) {
    this.poiData = poiData;
    this.options = options || {};
    this.marker = new tt.Marker({
      element: this.createMarker(),
      anchor: "bottom",
    });
    var lon = this.poiData.position.lng || this.poiData.position.lon;
    this.marker.setLngLat([lon, this.poiData.position.lat]);
}
  
SearchMarker.prototype.addTo = function (map) {
    this.marker.addTo(map);
    this._map = map;
    return this;
};
  
SearchMarker.prototype.createMarker = function () {
    var elem = document.createElement("div");
    elem.className = "tt-icon-marker-black tt-search-marker";
    if (this.options.markerClassName) {
      elem.className += " " + this.options.markerClassName;
    }
    var innerElem = document.createElement("div");
    innerElem.setAttribute(
      "style",
      "background: white; width: 10px; height: 10px; border-radius: 50%; border: 3px solid black;"
    );
  
    elem.appendChild(innerElem);
    return elem;
};
  
SearchMarker.prototype.remove = function () {
    this.marker.remove();
    this._map = null;
};

// ***** create goal location & routes to this point ***** //
let passengerMarker;

function createPassengerMarker(markerCoordinates, popup) {
  const passengerMarkerElement = document.createElement("div");
  passengerMarkerElement.innerHTML =
    "<img src='img/location.png' style='width: 30px; height: 30px';>";
  return new tt.Marker({ element: passengerMarkerElement })
    .setLngLat(markerCoordinates)
    .setPopup(popup)
    .addTo(map);
}

//put icon on the map and open popup
passengerMarker = createPassengerMarker(
  passengerInitCoordinates,
  new tt.Popup({ offset: 35 }).setHTML(
    "Click anywhere on the map to change passenger location."
  )
);

passengerMarker.togglePopup();

//change icon position
function drawPassengerMarkerOnMap(geoResponse) {
  if (
    geoResponse &&
    geoResponse.addresses &&
    geoResponse.addresses[0].address.freeformAddress
  ) {
    passengerMarker.remove();
    passengerMarker = createPassengerMarker(
      geoResponse.addresses[0].position,
      new tt.Popup({ offset: 35 }).setHTML(
        geoResponse.addresses[0].address.freeformAddress
      )
    );
    passengerMarker.togglePopup();
  }
}

map.on("click", function (event) {
  const position = event.lngLat;
  tt.services
    .reverseGeocode({
      key: apiKey,
      position: position,
    })
    .then(function (results) {
      drawPassengerMarkerOnMap(results);
    });
});

//adding vehicles to the map
let taxiConfig;
function setDefaultTaxiConfig() {
  taxiConfig = [
    createTaxi("CAR #1", "#ffa303", [4.908875, 52.370321], "img/car01.png"),
    createTaxi("CAR #2", "#e20524", [4.878376, 52.358531], "img/car02.png"),
    createTaxi("CAR #3", "#03ff6e", [4.853221, 52.364318], "img/car03.png"),
    createTaxi("CAR #4", "#7403ff", [4.891396, 52.349306], "img/car04.png"),
  ];
}

function createTaxi(
  name,
  color,
  coordinates,
  iconFilePath,
  iconWidth = 55,
  iconHeight = 55
) {
  return {
    name: name,
    color: color,
    icon:
      "<img src=" +
      iconFilePath +
      " style='width: " +
      iconWidth +
      "px; height: " +
      iconHeight +
      "px;'>",
    coordinates: coordinates,
  };
}

setDefaultTaxiConfig();

taxiConfig.forEach(function (taxi) {
  const carMarkerElement = document.createElement("div");
  carMarkerElement.innerHTML = taxi.icon;
  new tt.Marker({ element: carMarkerElement, offset: [0, 27] })
    .setLngLat(taxi.coordinates)
    .addTo(map);
});

//add routes
let routes = [];

//clear routes
function clear() {
    routes.forEach(function (child) {
      map.removeLayer(child[0]);
      map.removeLayer(child[1]);
      map.removeSource(child[0]);
      map.removeSource(child[1]);
    })
    routes = [];
    setDefaultTaxiConfig();
    passengerMarker.togglePopup();
  }

  function submitButtonHandler() {
    clear();
  }

document.getElementById("submit-button").addEventListener("click", submitButtonHandler);

// draw routes
const routeWeight = 9;
const routeBackgroundWeight = 12;

//adding array and function to be used with the batch routing call later
let taxiPassengerBatchCoordinates = [];

function updateTaxiBatchLocations(passengerCoordinates) {
  taxiPassengerBatchCoordinates = [];
  taxiConfig.forEach((taxi) => {
    taxiPassengerBatchCoordinates.push(
      taxi.coordinates + ":" + passengerCoordinates
    );
  });
}

setDefaultTaxiConfig();
updateTaxiBatchLocations(passengerInitCoordinates);

//calculate and draw routes
let bestRouteIndex;

function drawAllRoutes() {
  tt.services
    .calculateRoute({
      batchMode: "sync",
      key: apiKey,
      batchItems: [
        { locations: taxiPassengerBatchCoordinates[0] },
        { locations: taxiPassengerBatchCoordinates[1] },
        { locations: taxiPassengerBatchCoordinates[2] },
        { locations: taxiPassengerBatchCoordinates[3] },
      ],
    })
    .then(function (results) {
      results.batchItems.forEach(function (singleRoute, index) {
        const routeGeoJson = singleRoute.toGeoJson();
        const route = [];
        const route_background_layer_id = "route_background_" + index;
        const route_layer_id = "route_" + index;

        map
          .addLayer(
            buildStyle(
              route_background_layer_id,
              routeGeoJson,
              "black",
              routeBackgroundWeight
            )
          )
          .addLayer(
            buildStyle(
              route_layer_id,
              routeGeoJson,
              taxiConfig[index].color,
              routeWeight
            )
          );

        route[0] = route_background_layer_id;
        route[1] = route_layer_id;
        routes[index] = route;

        if (index === bestRouteIndex) {
          const bounds = new tt.LngLatBounds();
          routeGeoJson.features[0].geometry.coordinates.forEach(function (
            point
          ) {
            bounds.extend(tt.LngLat.convert(point));
          });
          map.fitBounds(bounds, { padding: 150 });
        }

        map.on("mouseenter", route_layer_id, function () {
          map.moveLayer(route_background_layer_id);
          map.moveLayer(route_layer_id);
        });

        map.on("mouseleave", route_layer_id, function () {
          bringBestRouteToFront();
        });
      });
      bringBestRouteToFront();
    });
}

function bringBestRouteToFront() {
  map.moveLayer(routes[bestRouteIndex][0]);
  map.moveLayer(routes[bestRouteIndex][1]);
}

function buildStyle(id, data, color, width) {
  return {
    id: id,
    type: "line",
    source: {
      type: "geojson",
      data: data,
    },
    paint: {
      "line-color": color,
      "line-width": width,
    },
    layout: {
      "line-cap": "round",
      "line-join": "round",
    },
  };
}

//Add a processMatrixResponse function
function processMatrixResponse(result) {
  const travelTimeInSecondsArray = [];
  const lengthInMetersArray = [];
  const trafficDelayInSecondsArray = [];
  result.matrix.forEach(function (child) {
    travelTimeInSecondsArray.push(
      child[0].response.routeSummary.travelTimeInSeconds
    );
    lengthInMetersArray.push(child[0].response.routeSummary.lengthInMeters);
    trafficDelayInSecondsArray.push(
      child[0].response.routeSummary.trafficDelayInSeconds
    );
  });
  drawAllRoutes();
}

//add the functions
function convertToPoint(lat, long) {
  return {
    point: {
      latitude: lat,
      longitude: long,
    },
  };
}

function buildOriginsParameter() {
  const origins = [];
  taxiConfig.forEach(function (taxi) {
    origins.push(convertToPoint(taxi.coordinates[1], taxi.coordinates[0]));
  });
  return origins;
}

function buildDestinationsParameter() {
  return [
    convertToPoint(
      passengerMarker.getLngLat().lat,
      passengerMarker.getLngLat().lng
    ),
  ];
}

//make request to the matrix routing API
function callMatrix() {
  const origins = buildOriginsParameter();
  const destinations = buildDestinationsParameter();
  tt.services
    .matrixRouting({
      key: apiKey,
      origins: origins,
      destinations: destinations,
      traffic: true,
    })
    .then(processMatrixResponse);
}

//finally add the call matrix function
function submitButtonHandler() {
  clear();
  callMatrix();
}

/** Create modal to see which route is fastest **/ 
const modal = document.getElementById("modal");
const modalContent = document.getElementById("modal-content");
const fastestRouteColor = "#65A7A9";

modal.addEventListener("click", function () {
    modal.style.display = "none";
  });
  
  function displayModal() {
    modalContent.innerText = "Dispatch car number " + String(bestRouteIndex + 1);
    modal.style.display = "block";
  };

  function modifyFastestRouteColor(travelTimeInSecondsArray) {
    const sortedTab = travelTimeInSecondsArray.slice();
    sortedTab.sort(function (a, b) {
      return a - b
    });
    bestRouteIndex = travelTimeInSecondsArray.indexOf(sortedTab[0]);
    taxiConfig[bestRouteIndex].color = fastestRouteColor;
  }

  function processMatrixResponse(result) {
    const travelTimeInSecondsArray = [];
    const lengthInMetersArray = [];
    const trafficDelayInSecondsArray = [];
    result.matrix.forEach(function (child) {
      travelTimeInSecondsArray.push(
        child[0].response.routeSummary.travelTimeInSeconds
      );
      lengthInMetersArray.push(child[0].response.routeSummary.lengthInMeters);
      trafficDelayInSecondsArray.push(
        child[0].response.routeSummary.trafficDelayInSeconds
      );
    });
    modifyFastestRouteColor(travelTimeInSecondsArray);
    drawAllRoutes();
    displayModal();
  }
/**
 * Initialize mapbox map
 */
setupMap = () => {
  mapboxgl.accessToken = 'pk.eyJ1Ijoic29tZXlvdW5naWRlYXMiLCJhIjoiY2pqMng2MWNpMTJkdTNqbndwbHZiZWQzcSJ9.HEIqaHAJmmakTeGbr6OK4A';
  const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/streets-v10',
    center: [-73.987501, 40.722216],
    zoom: 9
  });

  map.on('load', () => {
    addMarkersToMap(map);
  });
}

/**
 * Add markers for current restaurants to the map.
 */
addMarkersToMap = (map) => {
  const geoJSON = createGeoJSON();

  geoJSON.features.forEach(function(marker) {

    // create a HTML element for each feature
    var el = document.createElement('div');
    el.className = 'marker';

    // make a marker for each feature and add to the map
    new mapboxgl.Marker(el).setLngLat(marker.geometry.coordinates).addTo(map);
  });
}

/**
 * Add markers for current restaurants to the map.
 */
addMarkerToMap = (map) => {
  const geoJSON = {
    type: 'FeatureCollection',
    features: [DBHelper.geoJsonRestaurantPoint(self.restaurant)]
  };

  geoJSON.features.forEach(function(marker) {

    // create a HTML element for each feature
    var el = document.createElement('div');
    el.className = 'marker';

    // make a marker for each feature and add to the map
    new mapboxgl.Marker(el)
    .setLngLat(marker.geometry.coordinates)
    .addTo(map);
  });
}

createGeoJSON = () => {
  if (self.restaurants) {
    const restaurantsFeaturesJSON = self.restaurants.map(DBHelper.geoJsonRestaurantPoint);

    return {
      type: 'FeatureCollection',
      features: restaurantsFeaturesJSON
    };
  }
  else if (self.restaurant) {
    return {
      type: 'FeatureCollection',
      features: [DBHelper.geoJsonRestaurantPoint(self.restaurant)]
    }
  }
  else
    return [];

}

document.addEventListener('readystatechange', () => {
  if (document.readyState == 'complete')
  setupMap();
});
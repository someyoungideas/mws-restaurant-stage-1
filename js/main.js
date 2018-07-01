let restaurants,
  neighborhoods,
  cuisines
var map
var markers = []
var observer

/**
 * Fetch neighborhoods and cuisines as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {
  registerServiceWorker();
  createObserver();
  setupMap();
  fetchNeighborhoods();
  fetchCuisines();
  updateRestaurants();
});

registerServiceWorker = function() {
  if ('serviceWorker' in navigator === false) return;

  navigator.serviceWorker.register('/sw.js').catch(console.error);
}

createObserver = function() {
  const options = {
    root: null,
    rootMargin: "0px",
    threshold: 0
  };

  observer = new IntersectionObserver(intersectionCb, options);
}

/**
 * Fetch all neighborhoods and set their HTML.
 */
fetchNeighborhoods = () => {
  DBHelper.fetchNeighborhoods((error, neighborhoods) => {
    if (error) { // Got an error
      console.error(error);
    } else {
      self.neighborhoods = neighborhoods;
      fillNeighborhoodsHTML();
    }
  });
}

/**
 * Set neighborhoods HTML.
 */
fillNeighborhoodsHTML = (neighborhoods = self.neighborhoods) => {
  const select = document.getElementById('neighborhoods-select');
  neighborhoods.forEach(neighborhood => {
    const option = document.createElement('option');
    option.innerHTML = neighborhood;
    option.value = neighborhood;
    select.append(option);
  });
}

/**
 * Fetch all cuisines and set their HTML.
 */
fetchCuisines = () => {
  DBHelper.fetchCuisines((error, cuisines) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.cuisines = cuisines;
      fillCuisinesHTML();
    }
  });
}

/**
 * Set cuisines HTML.
 */
fillCuisinesHTML = (cuisines = self.cuisines) => {
  const select = document.getElementById('cuisines-select');

  cuisines.forEach(cuisine => {
    const option = document.createElement('option');
    option.innerHTML = cuisine;
    option.value = cuisine;
    select.append(option);
  });
}

/**
 * Update page and map for current restaurants.
 */
updateRestaurants = () => {
  const cSelect = document.getElementById('cuisines-select');
  const nSelect = document.getElementById('neighborhoods-select');

  const cIndex = cSelect.selectedIndex;
  const nIndex = nSelect.selectedIndex;

  const cuisine = cSelect[cIndex].value;
  const neighborhood = nSelect[nIndex].value;

  DBHelper.fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, (error, restaurants) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      resetRestaurants(restaurants);
      fillRestaurantsHTML();
    }
  })
}

/**
 * Clear current restaurants, their HTML and remove their map markers.
 */
resetRestaurants = (restaurants) => {
  // Remove all restaurants
  self.restaurants = [];
  const ul = document.getElementById('restaurants-list');
  ul.innerHTML = '';

  // Remove all map markers
  self.markers.forEach(m => m.setMap(null));
  self.markers = [];
  self.restaurants = restaurants;
}

/**
 * Create all restaurants HTML and add them to the webpage.
 */
fillRestaurantsHTML = (restaurants = self.restaurants) => {
  const ul = document.getElementById('restaurants-list');
  restaurants.forEach(restaurant => {
    ul.append(createRestaurantHTML(restaurant));
  });
}

/**
 * Create restaurant HTML.
 */
createRestaurantHTML = (restaurant) => {
  const li = document.createElement('li');

  li.append(createRestaurantPicture(restaurant));

  const name = document.createElement('h1');
  name.innerHTML = restaurant.name;
  li.append(name);

  const neighborhood = document.createElement('p');
  neighborhood.innerHTML = restaurant.neighborhood;
  li.append(neighborhood);

  const address = document.createElement('p');
  address.innerHTML = restaurant.address;
  li.append(address);

  const more = document.createElement('a');
  more.innerHTML = 'View Details';
  more.href = DBHelper.urlForRestaurant(restaurant);
  more.setAttribute('role', 'button');
  li.append(more)

  return li
}

/**
 * Create restaurant picture element
 */
createRestaurantPicture = (restaurant) => {
  const picture = document.createElement('picture');
  const imageUrl = DBHelper.imageUrlForRestaurant(restaurant);
  picture.className = 'restaurant-img';
  picture.setAttribute('data-url', imageUrl);
  picture.setAttribute('data-restaurant-name', restaurant.name);

  if (observer)
    observer.observe(picture);

  return picture;
}

/**
 * Handles intersection observer callback for pictures
 */
intersectionCb = (entries, observer) => {
  entries.forEach(entry => {
    const picture = entry.target;

    if (!entry.isIntersecting || picture.querySelector('img') !== null)
      return

    const imageUrl = picture.getAttribute('data-url');
    const restaurantName = picture.getAttribute('data-restaurant-name');

    if (imageUrl === null || restaurantName === null)
      return;

    const image = document.createElement('img');
    
    picture.append(createRestaurantSource(imageUrl.replace('jpg', 'webp'), '', 'image/webp'));
    picture.append(createRestaurantSource(`${imageUrl.slice(0, imageUrl.lastIndexOf('.')) + '_580' + '.jpg'}`, '(min-width: 580px)', 'image/jpg'));
    picture.append(createRestaurantSource(`${imageUrl.slice(0, imageUrl.lastIndexOf('.')) + '_980' + '.jpg'}`, '(min-width: 980px)', 'image/jpg'));
    picture.append(image);
    image.setAttribute('alt', restaurantName);
  });
}

/**
 * Creates restaurant source element
 */
createRestaurantSource = (srcset, mediaQuery, type) => {
  const source = document.createElement('source');
  source.setAttribute('type', type);
  source.setAttribute('srcset', srcset);
  source.setAttribute('media', mediaQuery);

  return source;
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

createGeoJSON = (restaurants = self.restaurants) => {
  if (!restaurants) return;

  const restaurantsFeaturesJSON = restaurants.map(DBHelper.geoJsonRestaurantPoint);

  return {
    type: 'FeatureCollection',
    features: restaurantsFeaturesJSON
  };
}

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
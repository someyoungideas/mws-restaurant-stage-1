/**
 * Common database helper functions.
 */
class DBHelper {
  /**
   * Server port
   * Change this to your server port
   */
  static get port() {
    return 1337;
  }

  /**
   * Database URL.
   * Change this to restaurants.json file location on your server.
   */
  static get DATABASE_URL() {
    return `http://localhost:${DBHelper.port}/restaurants`;
  }

  /**
   * Database URL.
   */
  static get REVIEWS_DATABASE_URL() {
    return `http://localhost:${DBHelper.port}/reviews`;
  }

  static openDatabase() {
    return idb.open('restaurantreviews', 1, upgradeDb => {
      const reviews = upgradeDb.createObjectStore('reviews', { keyPath: 'id', autoIncrement: true });

      reviews.createIndex('restaurant_id', 'restaurant_id');
      return upgradeDb.createObjectStore('restaurants', { keyPath: 'id' }); 
    }).catch(console.error);
  }

  static getRestaurants() {
    return DBHelper.openDatabase().then(db => {
      const tx = db.transaction('restaurants', 'readwrite');
      const store = tx.objectStore('restaurants');

      return store.getAll();
    }).catch(console.error)
  }

  static getReviews() {
    return DBHelper.openDatabase().then(db => {
      const tx = db.transaction('reviews', 'readwrite');
      const store = tx.objectStore('reviews');

      return store.getAll();
    }).catch(console.error);
  }

  static updateRestaurants(restaurants) {
    return DBHelper.openDatabase().then(db => {
      const tx = db.transaction('restaurants', 'readwrite');
      const store = tx.objectStore('restaurants');

      restaurants.forEach(r => store.put(r));
      tx.complete;
      return restaurants;
    }).catch(console.error);
  }

  static updateReviews(reviews) {
    return DBHelper.openDatabase().then(db => {
      const tx = db.transaction('reviews', 'readwrite');
      const store = tx.objectStore('reviews');

      reviews.forEach(r => store.put(r));
      tx.complete;
      return reviews;
    }).catch(console.error);
  }

  static updateRestaurantObjectStore(restaurant) {
    return DBHelper.openDatabase().then(db => {
      const tx = db.transaction('restaurants', 'readwrite');
      const store = tx.objectStore('restaurants');

      store.put(restaurant);
      tx.complete;
      return restaurant;
    }).catch(console.error);
  }

  static updateReview(review) {
    return DBHelper.openDatabase().then(db => {
      const tx = db.transaction('reviews', 'readwrite');
      const store = tx.objectStore('reviews');

      store.put(review);
      tx.complete;
      return review;
    }).catch(console.error);
  }

  /**
   * Fetch all restaurants.
   */
  static fetchRestaurants(callback) {
    const request = new Request(DBHelper.DATABASE_URL);

    return DBHelper.getRestaurants().then(restaurants => {
      return fetch(request).then(r => r.json())
        .then(serverRestaurants => {
          return DBHelper.updateRestaurants(serverRestaurants);
        })
        .catch(err => {
          console.error(err);
          return restaurants;
        });
    }).then(restaurants => {
      return callback(null, restaurants);
    }).catch(e => callback(e, null));
  }

  /**
   * Fetch all reviews.
   */
  static fetchReviews(callback) {
    const request = new Request(DBHelper.REVIEWS_DATABASE_URL);

    return DBHelper.getReviews().then(reviews => {
      return fetch(request).then(r => r.json())
        .then(serverReviews => {
          return DBHelper.updateReviews(serverReviews);
        })
        .catch(err => {
          console.error(err);
          return reviews;
        });
    }).then(reviews => {
      return callback(null, reviews);
    }).catch(e => callback(e, null));
  }

  /**
   * Fetch a restaurant by its ID.
   */
  static fetchRestaurantById(id, callback) {
    // fetch all restaurants with proper error handling.
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        const restaurant = restaurants.find(r => r.id == id);
        if (restaurant) { // Got the restaurant
          callback(null, restaurant);
        } else { // Restaurant does not exist in the database
          callback('Restaurant does not exist', null);
        }
      }
    });
  }

  /**
   * Fetch a review by its ID.
   */
  static fetchReviewsByRestaurantId(id, callback) {
    const request = new Request(`${DBHelper.REVIEWS_DATABASE_URL}/?restaurant_id=${id}`);

    return DBHelper.getReviews().then(reviews => {
      return fetch(request).then(r => r.json())
        .then(serverReviews => {
          return DBHelper.updateReviews(serverReviews);
        })
        .catch(err => {
          console.error(err);
          return reviews;
        });
    }).then(reviews => {
      return callback(null, reviews);
    }).catch(e => callback(e, null));
  }

  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
  static fetchRestaurantByCuisine(cuisine, callback) {
    // Fetch all restaurants  with proper error handling
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given cuisine type
        const results = restaurants.filter(r => r.cuisine_type == cuisine);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
  static fetchRestaurantByNeighborhood(neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given neighborhood
        const results = restaurants.filter(r => r.neighborhood == neighborhood);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
  static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        let results = restaurants
        if (cuisine != 'all') { // filter by cuisine
          results = results.filter(r => r.cuisine_type == cuisine);
        }
        if (neighborhood != 'all') { // filter by neighborhood
          results = results.filter(r => r.neighborhood == neighborhood);
        }
        callback(null, results);
      }
    });
  }

  /**
   * Fetch all neighborhoods with proper error handling.
   */
  static fetchNeighborhoods(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all neighborhoods from all restaurants
        const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood)
        // Remove duplicates from neighborhoods
        const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i)
        callback(null, uniqueNeighborhoods);
      }
    });
  }

  /**
   * Fetch all cuisines with proper error handling.
   */
  static fetchCuisines(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all cuisines from all restaurants
        const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type)
        // Remove duplicates from cuisines
        const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i)
        callback(null, uniqueCuisines);
      }
    });
  }

  /**
   * Updates restaurant with proper error handling.
   */
  static updateRestaurant(restaurant, callback) {
    const request = new Request(`${DBHelper.DATABASE_URL}/${restaurant.id}/?is_favorite=${restaurant.is_favorite}`);
    const init = {
      method: 'PUT'
    };

    DBHelper.updateRestaurantObjectStore(restaurant).then(_ => {
      fetch(request, init).then(r => r.json()).then(updatedRestaurant => {
        return callback(null, updatedRestaurant);
      })
      .catch(error => callback(error, null));
    });
  }

  /**
   * Create restaurant review with proper error handling.
   */
  static submitReview(review, callback) {
    const request = new Request(`${DBHelper.REVIEWS_DATABASE_URL}`);
    const init = {
      method: 'POST',
      body: JSON.stringify(review),
      headers:{
        'Content-Type': 'application/json'
      }
    };

    DBHelper.updateReview(review).then(_ => {
      fetch(request, init).then(r => r.json()).then(createdReview => {
        callback(null, createdReview);
      })
      .catch(error => callback(error, review));
    });
  }

  /**
   * Restaurant page URL.
   */
  static urlForRestaurant(restaurant) {
    return (`./restaurant.html?id=${restaurant.id}`);
  }

  /**
   * Restaurant image URL.
   */
  static imageUrlForRestaurant(restaurant) {
    return (`/build/images/${restaurant.photograph}.jpg`);
  }

  /**
   * Geo JSON for a restaurant.
   */
  static geoJsonRestaurantPoint(restaurant) {
    return {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [restaurant.latlng.lng, restaurant.latlng.lat]
      },
      properties: {
        title: 'Mapbox',
        description: restaurant.name
      }
    };
  }


  /**
   * Map marker for a restaurant.
   */
  static mapMarkerForRestaurant(restaurant, map) {
    const marker = new google.maps.Marker({
      position: restaurant.latlng,
      title: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant),
      map: map,
      animation: google.maps.Animation.DROP}
    );
    return marker;
  }

}

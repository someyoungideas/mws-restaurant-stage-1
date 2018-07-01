let restaurant;
var map;

document.addEventListener('DOMContentLoaded', (event) => {
  fetchRestaurantFromURL((error, restaurant) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      fillBreadcrumb();
      window.addEventListener('online',  handleConnectivityStatus);
      window.addEventListener('offline', handleConnectivityStatus);
    }
  });
});

/**
 * Adds event listener to offline and online window events
 */
handleConnectivityStatus = () => {
  const condition = navigator.onLine ? "online" : "offline";

  if (!navigator.onLine) return;

  DBHelper.getReviews().then(reviews => {
    const offlineReviews = reviews.filter(review => review.offline);

    offlineReviews.forEach(review => {
      DBHelper.submitReview(review, (err, submittedReview) => {
        if (err)
          console.error(err);
      });
    });
  }).catch(console.error);
}

/**
 * Get current restaurant from page URL.
 */
fetchRestaurantFromURL = (callback) => {
  if (self.restaurant) { // restaurant already fetched!
    callback(null, self.restaurant)
    return;
  }

  const id = getParameterByName('id');

  if (!id) { // no id found in URL
    error = 'No restaurant id in URL'
    callback(error, null);
  } else {
    DBHelper.fetchRestaurantById(id, (error, restaurant) => {
      self.restaurant = restaurant;      
      if (!restaurant) {
        console.error(error);
        return;
      }

      DBHelper.fetchReviewsByRestaurantId(id, (err, reviews) => {
        self.restaurant.reviews = reviews;
        fillRestaurantHTML();
        setupFavoriteButton(document.getElementById('restaurant-favorite'), restaurant);
        callback(null, restaurant)
      });
    });
  }
}

/**
 * Set up favorite button event listener
 */
setupFavoriteButton = (favoriteButton, restaurant) => {
  if (!favoriteButton)
    return console.error('Could not find favorite button.');

  favoriteButton.setAttribute('data-favorite', restaurant.is_favorite);
  favoriteButton.addEventListener('click', _ => {
    restaurant.is_favorite = favoriteButton.getAttribute('data-favorite') === 'true' ? false : true;
    DBHelper.updateRestaurant(restaurant, (error, updatedRestaurant) => {
      if (error)
        return console.error(error);

      favoriteButton.setAttribute('data-favorite', updatedRestaurant.is_favorite)
    });
  });
}

/**
 * Create restaurant HTML and add it to the webpage
 */
fillRestaurantHTML = (restaurant = self.restaurant) => {
  const name = document.getElementById('restaurant-name');
  name.innerHTML = restaurant.name;

  const address = document.getElementById('restaurant-address');
  address.innerHTML = restaurant.address;

  const image = document.getElementById('restaurant-img');
  image.className = 'restaurant-img'
  image.src = DBHelper.imageUrlForRestaurant(restaurant);
  image.setAttribute('alt', restaurant.name);

  const cuisine = document.getElementById('restaurant-cuisine');
  cuisine.innerHTML = restaurant.cuisine_type;

  // fill operating hours
  if (restaurant.operating_hours) {
    fillRestaurantHoursHTML();
  }
  // fill reviews
  fillReviewsHTML();
  setupAddReviewButton(restaurant.id, document.getElementById('add-review'));
}

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
  const hours = document.getElementById('restaurant-hours');
  for (let key in operatingHours) {
    const row = document.createElement('tr');

    const day = document.createElement('td');
    day.innerHTML = key;
    row.appendChild(day);

    const time = document.createElement('td');
    time.innerHTML = operatingHours[key];
    row.appendChild(time);

    hours.appendChild(row);
  }
}

/**
 * Create all reviews HTML and add them to the webpage.
 */
fillReviewsHTML = (reviews = self.restaurant.reviews) => {
  const container = document.getElementById('reviews-container');
  const title = document.createElement('h3');
  const addReviewButton = document.createElement('button');
  title.innerHTML = 'Reviews';
  addReviewButton.innerHTML = 'Add Review';
  addReviewButton.id = 'add-review';
  container.insertBefore(addReviewButton, container.firstChild);
  container.insertBefore(title, container.firstChild);

  if (!reviews) {
    const noReviews = document.createElement('p');
    noReviews.innerHTML = 'No reviews yet!';
    container.appendChild(noReviews);
    return;
  }

  const ul = document.createElement('ul');
  ul.id = 'reviews-list';
  reviews.forEach(review => {
    ul.appendChild(createReviewHTML(review));
  });
  container.appendChild(ul);
}

/**
 * Setup add review event listener
 */
setupAddReviewButton = (restaurantId, addReviewButton) => {
  addReviewButton.addEventListener('click', _ => createReviewFormHTML(restaurantId, addReviewButton));
}

/**
 * Create review HTML and add it to the webpage.
 */
createReviewHTML = (review) => {
  const li = document.createElement('li');
  const name = document.createElement('p');
  name.innerHTML = review.name;
  li.appendChild(name);

  const date = document.createElement('p');
  date.innerHTML = new Date(review.createdAt).toLocaleDateString();
  li.appendChild(date);

  const rating = document.createElement('p');
  rating.innerHTML = `Rating: ${review.rating}`;
  li.appendChild(rating);

  const comments = document.createElement('p');
  comments.innerHTML = review.comments;
  li.appendChild(comments);

  return li;
}

/**
 * Create review form HTML and add it to the webpage.
 */
createReviewFormHTML = (restaurantId, reviewButton) => {
  if (document.getElementById('review-form')) return;

  if (!reviewButton)
    return console.error('Could not find button to add reviews');

  const reviewForm = document.createElement('form');
  const commentLabel = document.createElement('label');
  const commentInput = document.createElement('textarea');
  const cancelButton = document.createElement('button');
  const submitButton = document.createElement('button');

  cancelButton.addEventListener('click', _ => reviewForm.parentNode.removeChild(reviewForm));
  reviewForm.addEventListener('submit', ev => {
    ev.preventDefault();
    submitReview(restaurantId, reviewForm);
  });


  reviewForm.id = 'review-form';
  commentLabel.innerHTML = 'Your Review';
  commentLabel.setAttribute('for', 'comments');
  commentInput.id = 'comments';
  commentInput.name = 'comments';
  cancelButton.innerHTML = 'Cancel';
  cancelButton.setAttribute('type', 'button');
  submitButton.innerHTML = 'Submit Review';
  submitButton.setAttribute('type', 'submit');

  createReviewFormInput(reviewForm, 'name', 'Your Name');
  createReviewFormInput(reviewForm, 'rating', 'Your Rating');
  reviewForm.appendChild(commentLabel);
  reviewForm.appendChild(commentInput);
  reviewForm.appendChild(cancelButton);
  reviewForm.appendChild(submitButton);
  reviewButton.parentNode.insertBefore(reviewForm, reviewButton.nextSibling);
  reviewForm.querySelector('input').focus();
}

/**
 * Submit review
 */
submitReview = (restaurantId, reviewForm) => {
  const formData = new FormData(reviewForm);
  const reviewJSON = getFormDataJSON(formData);

  if (!navigator.onLine)
    reviewJSON.offline = true;

  reviewJSON.restaurant_id = restaurantId;
  DBHelper.submitReview(reviewJSON, (error, review) => {
    if (error)
      console.error(error);

    reviewForm.parentElement.removeChild(reviewForm);

    const reviewsListElement = document.getElementById('reviews-list');

    if (reviewsListElement === null) return;

    reviewJSON.createdAt = review.createdAt ? new Date(review.createdAt).getTime() : new Date().getTime();
    reviewsListElement.appendChild(createReviewHTML(reviewJSON));
  });
}

/**
 * Converts form data to JSON
 */
getFormDataJSON =(formData) => {
  let jsonObject = {};

  for (const [key, value]  of formData.entries()) {
      jsonObject[key] = value;
  }

  return jsonObject;
}

/**
 * Create review form input element with corresponding label
 */
createReviewFormInput = (formElement, id, labelText) => {
  if (!formElement)
    return console.error('Could not find form element to create input.');

  const label = document.createElement('label');
  const input = document.createElement('input');

  label.innerHTML = labelText;
  label.setAttribute('for', id);
  input.id = id;
  input.name = id;

  formElement.appendChild(label);
  formElement.appendChild(input);
}

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
fillBreadcrumb = (restaurant=self.restaurant) => {
  const breadcrumb = document.getElementById('breadcrumb');
  const li = document.createElement('li');
  li.innerHTML = restaurant.name;
  breadcrumb.appendChild(li);
}

/**
 * Get a parameter by name from page URL.
 */
getParameterByName = (name, url) => {
  if (!url)
    url = window.location.href;
  name = name.replace(/[\[\]]/g, '\\$&');
  const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
    results = regex.exec(url);
  if (!results)
    return null;
  if (!results[2])
    return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

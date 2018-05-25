const cache = 'restaurant_reviews';

self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        if (response)
          return response;
      
        const fetchRequest = event.request.clone();

        return fetch(fetchRequest).then(
          function(response) {
            if(!response || response.status !== 200 || response.type !== 'basic')
              return response;

            const responseToCache = response.clone();
            const url = new URL(event.request.url);

            if (url.hostname === 'localhost') {
              caches.open(cache)
                .then(function(cache) {
                  cache.put(event.request, responseToCache);
                });
            } 

            return response;
          }
        );
      }
    )
  );
});
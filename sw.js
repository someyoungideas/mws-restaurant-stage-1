const cache = 'restaurant_reviews';

self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        if (response)
          return response;
      
        return caches.open(cache).then(function(cache) {
          const fetchRequest = event.request.clone();

          return fetch(fetchRequest).then(function(response) {
            if(!response || response.status !== 200 || response.type !== 'basic')
              return response;

            const url = new URL(event.request.url);
            const responseToCache = response.clone();

            if (url.hostname === location.hostname)
              cache.put(event.request, responseToCache);

            return response;
          });
        });
      }
    ).catch(console.error)
  );
});
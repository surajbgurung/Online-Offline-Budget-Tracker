console.log("i am from service-worker.js");
const FILES_TO_CACHE = ["/", 
"/index.html", 
"/index.js", 
"/manifest.webmanifest",
"/icons/icon-192x192.png",
"/icons/icon-512x512.png"

];


    //all static files are cache and assign to variable
    const CACHE_NAME = "static-cache-v2";
    //all data files are casche and assign to variable
    const DATA_CACHE_NAME = "data-cache-v1";
    //install  and register the service worker with our static files
    self.addEventListener('install', function(evt) {
        evt.waitUntil(
          caches.open(CACHE_NAME).then(cache => {
            console.log("Your files were pre-cached successfully!");
            return cache.addAll(FILES_TO_CACHE);
            
          })
        );
    
        self.skipWaiting();
      });
    //activate the service worker and remove old data from the cache.
      self.addEventListener("activate", function(evt) {
        console.log("from self");
        evt.waitUntil(
          caches.keys().then(keyList => {
            return Promise.all(
              keyList.map(key => {
                if (key !== CACHE_NAME && key !== DATA_CACHE_NAME) {
                  console.log("Removing old cache data", key);
                  return caches.delete(key);
                }
              })
            );
          })
        );
    
        self.clients.claim();
      });
    
      //Enable the service worker to intercept network requests.
      self.addEventListener ('fetch', function(evt) {
        // code to handle requests goes here
        if (evt.request.url.includes("/api/")) {
            evt.respondWith(
              caches.open(DATA_CACHE_NAME).then(cache => {
                return fetch(evt.request)
                  .then(response => {
                    // If the response was good, clone it and store it in the cache.
                    if (response.status === 200) {
                      cache.put(evt.request.url, response.clone());
                    }
        
                    return response;
                  })
                  .catch(err => {
                    // Network request failed, try to get it from the cache.
                    //Serve static files from the cache. Proceed with a network request when the resource is not in the cache. This code allows the page to be accessible offline. (This code should be placed in the function handling the `fetch` event.)
                    return cache.match(evt.request);
                  });
              }).catch(err => console.log(err))
            );
        
            return;
          }
        
          // if the request is not for the API, serve static assets using "offline-first" approach.
          // see https://developers.google.com/web/fundamentals/instant-and-offline/offline-cookbook#cache-falling-back-to-network
          evt.respondWith(
            caches.match(evt.request).then(function(response) {
              return response || fetch(evt.request);
            })
          );
        
        });
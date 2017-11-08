function debounce(func, delay) {
 var timeout;
 return function() {
   var args = arguments;
   if (timeout) {
     clearTimeout(timeout);
   }
   timeout = setTimeout(function() {
     func.apply(null, args);
   }, delay);
 }
}

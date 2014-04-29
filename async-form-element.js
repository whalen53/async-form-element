(function() {
  'use strict';

  var Promise = window.Promise;

  var AsyncFormElementPrototype = Object.create(HTMLFormElement.prototype);

  function makeDeferred() {
    var resolve, reject;
    var promise = new Promise(function(_resolve, _reject) {
      resolve = _resolve;
      reject = _reject;
    });
    return Object.create(promise, {
      resolve: { value: resolve },
      reject: { value: reject }
    });
  }

  function captureAsyncFormSubmit(event) {
    if (AsyncFormElementPrototype.isPrototypeOf(event.target)) {
      event.submission = makeDeferred();
      event.waitUntil = function() {};

      window.removeEventListener('submit', handleAsyncFormSubmit, false);
      window.addEventListener('submit', handleAsyncFormSubmit, false);
    }
  }

  function handleAsyncFormSubmit(event) {
    if (!event.defaultPrevented) {
      event.target.request().then(
        event.submission.resolve,
        event.submission.reject
      );
    }

    // Always disable default form submit
    event.preventDefault();
  }

  window.addEventListener('submit', captureAsyncFormSubmit, true);


  AsyncFormElementPrototype.createdCallback = function() {
  };

  AsyncFormElementPrototype.submit = function() {
    var event = new window.Event('submit', {
      bubbles: true,
      cancelable: true
    });
    this.dispatchEvent(event);
    return event.submission;
  };

  AsyncFormElementPrototype.request = function() {
    var form = this;
    return new Promise(function(resolve, reject) {
      var req = new XMLHttpRequest();

      var method = form.method.toUpperCase();
      var url = form.action;

      req.open(method, url);

      req.onload = function() {
        if (req.status === 200) {
          resolve(req.response);
        } else {
          reject(new Error(req.statusText));
        }
      };

      req.onerror = function() {
        reject(new Error('Network Error'));
      };

      req.send();
    });
  };

  window.AsyncFormElement = document.registerElement('async-form', {
    prototype: AsyncFormElementPrototype,
    'extends': 'form'
  });
})();

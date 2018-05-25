(function() {
  'use strict';

  function attachStylesheet(content) {
    var element = document.createElement('style');
    element.type = 'text/css';
    if (document.head) {
      document.head.appendChild(element);
    }
    // $FlowFixMe
    if (element.styleSheet) {
      element.styleSheet.cssText = content;
    } else {
      element.appendChild(document.createTextNode(content));
    }
    return element;
  }

  function removeNode(node) {
    if (node && node.parentNode) {
      node.parentNode.removeChild(node);
    }
  }

  var toString = Object.prototype.toString;

  function isArray(input) {
    return toString.call(input) === '[object Array]';
  }

  var hasOwn = Object.prototype.hasOwnProperty;

  function hasOwnProperty(object, propertyName) {
    return hasOwn.call(object, propertyName);
  }

  var _slicedToArray = (function() {
    function sliceIterator(arr, i) {
      var _arr = [];
      var _n = true;
      var _d = false;
      var _e = undefined;
      try {
        for (
          var _i = arr[Symbol.iterator](), _s;
          !(_n = (_s = _i.next()).done);
          _n = true
        ) {
          _arr.push(_s.value);
          if (i && _arr.length === i) break;
        }
      } catch (err) {
        _d = true;
        _e = err;
      } finally {
        try {
          if (!_n && _i['return']) _i['return']();
        } finally {
          if (_d) throw _e;
        }
      }
      return _arr;
    }
    return function(arr, i) {
      if (isArray(arr)) {
        return arr;
      } else if (Symbol.iterator in Object(arr)) {
        return sliceIterator(arr, i);
      } else {
        throw new TypeError(
          'Invalid attempt to destructure non-iterable instance'
        );
      }
    };
  })();

  function setStyles(element, styles) {
    styles = styles || {};
    for (var key in styles) {
      if (hasOwnProperty(styles, key)) {
        if (isArray(styles[key])) {
          var _styles$key = _slicedToArray(styles[key], 2),
            value = _styles$key[0],
            priority = _styles$key[1];

          element.style.setProperty(key, value, priority);
        } else {
          // $FlowFixMe
          element.style.setProperty(key, styles[key]);
        }
      }
    }
  }

  function setAttributes(element, attributes, styles) {
    attributes = attributes || {};
    for (var key in attributes) {
      if (hasOwnProperty(attributes, key)) {
        // $FlowFixMe
        element[key] = attributes[key];
      }
    }
    setStyles(element, styles);
    return element;
  }

  function listen(element, name, listener) {
    if (element.addEventListener) {
      element.addEventListener(name, listener, false);
    } else {
      // $FlowFixMe
      element.attachEvent('on' + name, listener);
    }
    return {
      remove: function remove() {
        if (element.removeEventListener) {
          element.removeEventListener(name, listener);
        } else {
          // $FlowFixMe
          element.detachEvent('on' + name, listener);
        }
      }
    };
  }

  function listenOnce(element, name, listener) {
    var subscription = listen(element, name, function(event) {
      subscription.remove();
      listener(event);
    });
  }

  function _toConsumableArray(arr) {
    if (isArray(arr)) {
      for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) {
        arr2[i] = arr[i];
      }
      return arr2;
    } else {
      return Array.from(arr);
    }
  }

  function attachFrame(parentElement, styles, callback) {
    var attributes = {
      frameBorder: '0',
      allowTransparency: true,
      src: 'about:blank'
    };
    var frame = setAttributes(
      document.createElement('iframe'),
      attributes,
      styles
    );
    if (callback) {
      listenOnce(frame, 'load', callback);
    }
    // In some cases the load event will fire synchronously, as soon as we insert
    // into DOM, so for consistency, make it async.
    setTimeout(function() {
      parentElement.appendChild(frame);
    }, 0);
    return frame;
  }

  // Attach an iframe and setup a communication channel which uses postMessage
  function attachFrameWithChannel(opts) {
    var actions = opts.actions || {};
    var subscription = listen(window, 'message', function(event) {
      if (event.source !== frame.contentWindow) {
        return;
      }
      var data = Object(event.data) || {};
      var id = String(data.id);
      var actionName = String(data.action);
      var args = isArray(data.args) ? data.args : [];
      var method = actions[actionName];
      var result = method
        ? method.apply(undefined, _toConsumableArray(args))
        : null;
      frame.contentWindow.postMessage(
        {type: 'response', id: id, data: result},
        '*'
      );
    });
    // eslint-disable-next-line no-unused-vars
    var frame = attachFrame(opts.parentElement, opts.styles, function(event) {
      frame.src = opts.url;
      if (opts.onLoad) {
        listenOnce(frame, 'load', opts.onLoad);
      }
    });
    return {
      destroy: function destroy() {
        subscription.remove();
        removeNode(frame);
      }
    };
  }

  var savedPageState = null;

  function disablePageScroll() {
    if (savedPageState) {
      return;
    }
    if (!document.documentElement || !document.body) {
      return;
    }
    var html = document.documentElement;
    var body = document.body;
    savedPageState = {
      scrollLeft: window.pageXOffset, // or window.scrollX ?
      scrollTop: window.pageYOffset, // or window.scrollY ?
      htmlStyle: html.getAttribute('style'),
      bodyStyle: body.getAttribute('style')
    };
    var currentWidth = body.clientWidth;
    var currentHeight = body.clientHeight;
    body.style.width = currentWidth + 'px';
    body.style.height = currentHeight + 'px';
    html.style.height = '100%';
    html.style.overflow = 'hidden';
  }

  function enablePageScroll() {
    if (!savedPageState) {
      return;
    }
    if (!document.documentElement || !document.body) {
      return;
    }
    var html = document.documentElement;
    var body = document.body;
    if (savedPageState.htmlStyle == null) {
      html.removeAttribute('style');
    } else {
      html.setAttribute('style', savedPageState.htmlStyle);
    }
    if (savedPageState.bodyStyle == null) {
      body.removeAttribute('style');
    } else {
      body.setAttribute('style', savedPageState.bodyStyle);
    }
    window.scrollTo(savedPageState.scrollLeft, savedPageState.scrollTop);
    savedPageState = null;
  }

  var defaultParams = {
    bubbles: false,
    cancelable: false
  };

  function createCustomEvent(eventName) {
    var params =
      arguments.length > 1 && arguments[1] !== undefined
        ? arguments[1]
        : defaultParams;

    if (typeof CustomEvent === 'function') {
      // Modern Browser
      return new CustomEvent(eventName, params);
    } else {
      // Legacy Browser
      var event = document.createEvent('CustomEvent');
      event.initCustomEvent(
        eventName,
        Boolean(params.bubbles),
        Boolean(params.cancelable),
        params.detail
      );
      return event;
    }
  }

  var random = Math.floor(Math.random() * Math.pow(2, 53)).toString(36);
  var cssID = 'x' + random;

  var animationName = 'a' + random;

  var styles =
    '\nbody * {\n  z-index: auto !important\n}\n#' +
    cssID +
    ' {\n  display: block;\n  width: 40px;\n  height: 40px;\n  position: absolute;\n  left: 50%;\n  top: 50%;\n  margin: -20px 0 0 -20px;\n  padding: 0;\n  border: 0;\n}\n\n#' +
    cssID +
    ':before, #' +
    cssID +
    ':after {\n  display: block;\n  content: "";\n  width: 100%;\n  height: 100%;\n  border-radius: 50%;\n  background-color: #fff;\n  opacity: 0.6;\n  position: absolute;\n  top: 0;\n  left: 0;\n  -webkit-animation: ' +
    animationName +
    ' 2.0s infinite ease-in-out;\n  animation: ' +
    animationName +
    ' 2.0s infinite ease-in-out;\n}\n\n#' +
    cssID +
    ':after {\n  -webkit-animation-delay: -1.0s;\n  animation-delay: -1.0s;\n}\n\n@-webkit-keyframes ' +
    animationName +
    ' {\n  0%, 100% { -webkit-transform: scale(0.0) }\n  50% { -webkit-transform: scale(1.0) }\n}\n\n@keyframes ' +
    animationName +
    ' {\n  0%, 100% {\n    transform: scale(0.0);\n    -webkit-transform: scale(0.0);\n  } 50% {\n    transform: scale(1.0);\n    -webkit-transform: scale(1.0);\n  }\n}\n';

  var version = '1.1.3';

  var _createClass = (function() {
    function defineProperties(target, props) {
      for (var i = 0; i < props.length; i++) {
        var descriptor = props[i];
        descriptor.enumerable = descriptor.enumerable || false;
        descriptor.configurable = true;
        if ('value' in descriptor) descriptor.writable = true;
        Object.defineProperty(target, descriptor.key, descriptor);
      }
    }
    return function(Constructor, protoProps, staticProps) {
      if (protoProps) defineProperties(Constructor.prototype, protoProps);
      if (staticProps) defineProperties(Constructor, staticProps);
      return Constructor;
    };
  })();

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError('Cannot call a class as a function');
    }
  }

  function resolve() {}

  function reject() {}

  var PromiseStub = (function() {
    function PromiseStub(fn) {
      _classCallCheck(this, PromiseStub);

      fn(resolve, reject);
    }

    _createClass(PromiseStub, [
      {
        key: 'then',
        value: function then() {}
      },
      {
        key: 'catch',
        value: function _catch() {}
      }
    ]);

    return PromiseStub;
  })();

  var isNative =
    typeof Promise === 'function' && typeof Promise.resolve === 'function';

  function getPromise() {
    if (isNative) {
      return Promise;
    } else {
      var _Promise = PromiseStub;
      return _Promise;
    }
  }

  var Promise$1 = getPromise();

  function _objectWithoutProperties(obj, keys) {
    var target = {};
    for (var i in obj) {
      if (keys.indexOf(i) >= 0) continue;
      if (!Object.prototype.hasOwnProperty.call(obj, i)) continue;
      target[i] = obj[i];
    }
    return target;
  }

  var HOST = 'http://localhost:3000';
  var RESOURCE_URL = HOST + '/activate';
  var dialog = void 0;

  function showActivation(config) {
    if (dialog) {
      return dialog.result;
    }

    var onSuccess = config.onSuccess,
      onError = config.onError,
      params = _objectWithoutProperties(config, ['onSuccess', 'onError']);

    disablePageScroll();
    var styleElement = attachStylesheet(styles);

    var outerContainer = setAttributes(
      document.createElement('div'),
      {},
      {
        border: 0,
        padding: 0,
        margin: 0,
        display: 'block',
        position: 'fixed',
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        'z-index': [100, 'important'],
        background: 'rgba(0, 0, 0, .6)'
      }
    );

    var loadingIndicator = setAttributes(
      document.createElement('div'),
      {id: cssID},
      {}
    );

    var innerContainer = setAttributes(
      document.createElement('div'),
      {},
      {
        border: 0,
        padding: 0,
        margin: 0,
        position: 'absolute',
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        // Hide the element until the frame has finished loading.
        visibility: 'hidden'
      }
    );

    outerContainer.appendChild(loadingIndicator);
    outerContainer.appendChild(innerContainer);

    var frame = void 0;

    var promise = new Promise$1(function(resolve, reject) {
      frame = attachFrameWithChannel({
        parentElement: innerContainer,
        url: RESOURCE_URL,
        styles: {
          display: 'block',
          width: '100%',
          height: '100%',
          border: 0,
          padding: 0,
          margin: 0,
          'background-color': 'transparent'
        },
        onLoad: function onLoad() {
          setTimeout(function() {
            removeNode(loadingIndicator);
            innerContainer.style.visibility = 'visible';
          }, 500);
        },

        actions: {
          getParams: function getParams() {
            return params;
          },
          close: function close() {
            remove();
            onSuccess && onSuccess();
            resolve();
          },
          error: (function(_error) {
            function error(_x) {
              return _error.apply(this, arguments);
            }

            error.toString = function() {
              return _error.toString();
            };

            return error;
          })(function(error) {
            onError && onError(error);
            reject(error);
          })
        }
      });
    });

    if (document.body) {
      document.body.appendChild(outerContainer);
    }
    var remove = function remove() {
      frame && frame.destroy();
      removeNode(outerContainer);
      removeNode(styleElement);
      enablePageScroll();
      dialog = null;
    };
    var result = isNative ? promise : null;
    dialog = {remove: remove, result: result};
    return result;
  }

  window.vospay = {
    ...window.vospay,
    version: version,
    showActivation: showActivation,
    close: function close() {
      dialog && dialog.remove();
    }
  };

  // Notify listeners that the SDK has been loaded.
  document.dispatchEvent(createCustomEvent('vospay_sdk_loaded'));
})();

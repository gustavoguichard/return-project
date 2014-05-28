/*!
 * ----------------------------------------------------------------------
 * Webflow: Front-end site library
 * @license MIT
 * Other scripts may access this api using an async handler:
 *   var Webflow = Webflow || [];
 *   Webflow.push(readyFunction);
 * ----------------------------------------------------------------------
 */
var Webflow = { w: Webflow };
Webflow.init = function () {
  'use strict';

  var $ = window.$;
  var api = {};
  var modules = {};
  var primary = [];
  var secondary = this.w || [];
  var $win = $(window);
  var _ = api._ = underscore();
  var domready = false;
  var tram = window.tram;
  var Modernizr = window.Modernizr;
  tram.config.hideBackface = false;
  tram.config.keepInherited = true;

  /**
   * Webflow.define() - Define a webflow.js module
   * @param  {string} name
   * @param  {function} factory
   */
  api.define = function (name, factory) {
    var module = modules[name] = factory($, _);
    if (!module) return;
    // If running in Webflow app, subscribe to design/preview events
    if (api.env()) {
      $.isFunction(module.design) && window.addEventListener('__wf_design', module.design);
      $.isFunction(module.preview) && window.addEventListener('__wf_preview', module.preview);
    }
    // Look for a ready method on module
    if (module.ready && $.isFunction(module.ready)) {
      // If domready has already happened, call ready method
      if (domready) module.ready();
      // Otherwise push ready method into primary queue
      else primary.push(module.ready);
    }
  };

  /**
   * Webflow.require() - Load a Webflow.js module
   * @param  {string} name
   * @return {object}
   */
  api.require = function (name) {
    return modules[name];
  };

  /**
   * Webflow.push() - Add a ready handler into secondary queue
   * @param {function} ready  Callback to invoke on domready
   */
  api.push = function (ready) {
    // If domready has already happened, invoke handler
    if (domready) {
      $.isFunction(ready) && ready();
      return;
    }
    // Otherwise push into secondary queue
    secondary.push(ready);
  };

  /**
   * Webflow.env() - Get the state of the Webflow app
   * @param {string} mode [optional]
   * @return {boolean}
   */
  api.env = function (mode) {
    var designFlag = window.__wf_design;
    var inApp = typeof designFlag != 'undefined';
    if (!mode) return inApp;
    if (mode == 'design') return inApp && designFlag;
    if (mode == 'preview') return inApp && !designFlag;
    if (mode == 'slug') return inApp && window.__wf_slug;
  };

  // Feature detects + browser sniffs  ಠ_ಠ
  var userAgent = navigator.userAgent.toLowerCase();
  var appVersion = navigator.appVersion.toLowerCase();
  api.env.touch = ('ontouchstart' in window) || window.DocumentTouch && document instanceof window.DocumentTouch;
  var chrome = api.env.chrome = (window.chrome || /chrome/.test(userAgent)) && parseInt(appVersion.match(/chrome\/(\d+)\./)[1], 10);
  var ios = api.env.ios = Modernizr && Modernizr.ios;
  api.env.safari = /safari/.test(userAgent) && !chrome && !ios;

  /**
   * Webflow.script() - Append script to document head
   * @param {string} src
   */
  api.script = function (src) {
    var doc = document;
    var scriptNode = doc.createElement('script');
    scriptNode.type = 'text/javascript';
    scriptNode.src = src;
    doc.getElementsByTagName('head')[0].appendChild(scriptNode);
  };

  /**
   * Webflow.resize, Webflow.scroll - throttled event proxies
   */
  var resizeEvents = 'resize.webflow orientationchange.webflow load.webflow';
  var scrollEvents = 'scroll.webflow ' + resizeEvents;
  api.resize = eventProxy($win, resizeEvents);
  api.scroll = eventProxy($win, scrollEvents);
  api.redraw = eventProxy();

  // Create a proxy instance for throttled events
  function eventProxy(target, types) {

    // Set up throttled method (using custom frame-based _.throttle)
    var handlers = [];
    var proxy = {};
    proxy.up = _.throttle(function (evt) {
      _.each(handlers, function (h) { h(evt); });
    });

    // Bind events to target
    if (target && types) target.on(types, proxy.up);

    /**
     * Add an event handler
     * @param  {function} handler
     */
    proxy.on = function (handler) {
      if (typeof handler != 'function') return;
      if (_.contains(handlers, handler)) return;
      handlers.push(handler);
    };

    /**
     * Remove an event handler
     * @param  {function} handler
     */
    proxy.off = function (handler) {
      handlers = _.filter(handlers, function (h) {
        return h !== handler;
      });
    };
    return proxy;
  }

  // Webflow.location - Wrap window.location in api
  api.location = function (url) {
    window.location = url;
  };

  // Webflow.app - Designer-specific methods
  api.app = api.env() ? {} : null;
  if (api.app) {

    // Trigger redraw for specific elements
    var Event = window.Event;
    var redraw = new Event('__wf_redraw');
    api.app.redrawElement = function (i, el) { el.dispatchEvent(redraw); };

    // Webflow.location - Re-route location change to trigger an event
    api.location = function (url) {
      window.dispatchEvent(new CustomEvent('__wf_location', { detail: url }));
    };
  }

  // DOM ready - Call primary and secondary handlers
  $(function () {
    domready = true;
    $.each(primary.concat(secondary), function (index, value) {
      $.isFunction(value) && value();
    });
    // Trigger resize
    api.resize.up();
  });

  /*!
   * Webflow._ (aka) Underscore.js 1.5.2 (custom build)
   * _.each
   * _.map
   * _.filter
   * _.any
   * _.contains
   * _.delay
   * _.defer
   * _.throttle (webflow)
   * _.debounce
   * _.keys
   * _.has
   *
   * http://underscorejs.org
   * (c) 2009-2013 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
   * Underscore may be freely distributed under the MIT license.
   */
  function underscore() {
    var _ = {};

    // Current version.
    _.VERSION = '1.5.2-Webflow';

    // Establish the object that gets returned to break out of a loop iteration.
    var breaker = {};

    // Save bytes in the minified (but not gzipped) version:
    var ArrayProto = Array.prototype, ObjProto = Object.prototype, FuncProto = Function.prototype;

    // Create quick reference variables for speed access to core prototypes.
    var
      push             = ArrayProto.push,
      slice            = ArrayProto.slice,
      concat           = ArrayProto.concat,
      toString         = ObjProto.toString,
      hasOwnProperty   = ObjProto.hasOwnProperty;

    // All **ECMAScript 5** native function implementations that we hope to use
    // are declared here.
    var
      nativeForEach      = ArrayProto.forEach,
      nativeMap          = ArrayProto.map,
      nativeReduce       = ArrayProto.reduce,
      nativeReduceRight  = ArrayProto.reduceRight,
      nativeFilter       = ArrayProto.filter,
      nativeEvery        = ArrayProto.every,
      nativeSome         = ArrayProto.some,
      nativeIndexOf      = ArrayProto.indexOf,
      nativeLastIndexOf  = ArrayProto.lastIndexOf,
      nativeIsArray      = Array.isArray,
      nativeKeys         = Object.keys,
      nativeBind         = FuncProto.bind;

    // Collection Functions
    // --------------------

    // The cornerstone, an `each` implementation, aka `forEach`.
    // Handles objects with the built-in `forEach`, arrays, and raw objects.
    // Delegates to **ECMAScript 5**'s native `forEach` if available.
    var each = _.each = _.forEach = function(obj, iterator, context) {
      /* jshint shadow:true */
      if (obj == null) return;
      if (nativeForEach && obj.forEach === nativeForEach) {
        obj.forEach(iterator, context);
      } else if (obj.length === +obj.length) {
        for (var i = 0, length = obj.length; i < length; i++) {
          if (iterator.call(context, obj[i], i, obj) === breaker) return;
        }
      } else {
        var keys = _.keys(obj);
        for (var i = 0, length = keys.length; i < length; i++) {
          if (iterator.call(context, obj[keys[i]], keys[i], obj) === breaker) return;
        }
      }
    };

    // Return the results of applying the iterator to each element.
    // Delegates to **ECMAScript 5**'s native `map` if available.
    _.map = _.collect = function(obj, iterator, context) {
      var results = [];
      if (obj == null) return results;
      if (nativeMap && obj.map === nativeMap) return obj.map(iterator, context);
      each(obj, function(value, index, list) {
        results.push(iterator.call(context, value, index, list));
      });
      return results;
    };

    // Return all the elements that pass a truth test.
    // Delegates to **ECMAScript 5**'s native `filter` if available.
    // Aliased as `select`.
    _.filter = _.select = function(obj, iterator, context) {
      var results = [];
      if (obj == null) return results;
      if (nativeFilter && obj.filter === nativeFilter) return obj.filter(iterator, context);
      each(obj, function(value, index, list) {
        if (iterator.call(context, value, index, list)) results.push(value);
      });
      return results;
    };

    // Determine if at least one element in the object matches a truth test.
    // Delegates to **ECMAScript 5**'s native `some` if available.
    // Aliased as `any`.
    var any = _.some = _.any = function(obj, iterator, context) {
      iterator || (iterator = _.identity);
      var result = false;
      if (obj == null) return result;
      if (nativeSome && obj.some === nativeSome) return obj.some(iterator, context);
      each(obj, function(value, index, list) {
        if (result || (result = iterator.call(context, value, index, list))) return breaker;
      });
      return !!result;
    };

    // Determine if the array or object contains a given value (using `===`).
    // Aliased as `include`.
    _.contains = _.include = function(obj, target) {
      if (obj == null) return false;
      if (nativeIndexOf && obj.indexOf === nativeIndexOf) return obj.indexOf(target) != -1;
      return any(obj, function(value) {
        return value === target;
      });
    };

    // Function (ahem) Functions
    // --------------------

    // Delays a function for the given number of milliseconds, and then calls
    // it with the arguments supplied.
    _.delay = function(func, wait) {
      var args = slice.call(arguments, 2);
      return setTimeout(function(){ return func.apply(null, args); }, wait);
    };

    // Defers a function, scheduling it to run after the current call stack has
    // cleared.
    _.defer = function(func) {
      return _.delay.apply(_, [func, 1].concat(slice.call(arguments, 1)));
    };

    // Returns a function, that, when invoked, will only be triggered once every
    // browser animation frame - using tram's requestAnimationFrame polyfill.
    _.throttle = function(func) {
      var wait, args, context;
      return function () {
        if (wait) return;
        wait = true;
        args = arguments;
        context = this;
        tram.frame(function () {
          wait = false;
          func.apply(context, args);
        });
      };
    };

    // Returns a function, that, as long as it continues to be invoked, will not
    // be triggered. The function will be called after it stops being called for
    // N milliseconds. If `immediate` is passed, trigger the function on the
    // leading edge, instead of the trailing.
    _.debounce = function(func, wait, immediate) {
      var timeout, args, context, timestamp, result;
      return function() {
        context = this;
        args = arguments;
        timestamp = new Date();
        var later = function() {
          var last = (new Date()) - timestamp;
          if (last < wait) {
            timeout = setTimeout(later, wait - last);
          } else {
            timeout = null;
            if (!immediate) result = func.apply(context, args);
          }
        };
        var callNow = immediate && !timeout;
        if (!timeout) {
          timeout = setTimeout(later, wait);
        }
        if (callNow) result = func.apply(context, args);
        return result;
      };
    };

    // Object Functions
    // ----------------

    // Retrieve the names of an object's properties.
    // Delegates to **ECMAScript 5**'s native `Object.keys`
    _.keys = nativeKeys || function(obj) {
      if (obj !== Object(obj)) throw new TypeError('Invalid object');
      var keys = [];
      for (var key in obj) if (_.has(obj, key)) keys.push(key);
      return keys;
    };

    // Shortcut function for checking if an object has a given property directly
    // on itself (in other words, not on a prototype).
    _.has = function(obj, key) {
      return hasOwnProperty.call(obj, key);
    };

    // Export underscore
    return _;
  }

  // Export api
  Webflow = api;
};
/*!
 * ----------------------------------------------------------------------
 * Webflow: 3rd party plugins
 */
/* jshint ignore:start */
/*!
 * tram.js v0.8.0-global
 * Cross-browser CSS3 transitions in JavaScript
 * https://github.com/bkwld/tram
 * MIT License
 */
window.tram=function(t){function i(t,i){var e=new Z.Bare;return e.init(t,i)}function e(t){return t.replace(/[A-Z]/g,function(t){return"-"+t.toLowerCase()})}function n(t){var i=parseInt(t.slice(1),16),e=255&i>>16,n=255&i>>8,r=255&i;return[e,n,r]}function r(t,i,e){return"#"+(1<<24|t<<16|i<<8|e).toString(16).slice(1)}function s(){}function a(t,i){_("Type warning: Expected: ["+t+"] Got: ["+typeof i+"] "+i)}function o(t,i,e){_("Units do not match ["+t+"]: "+i+", "+e)}function u(t,i,e){if(void 0!==i&&(e=i),void 0===t)return e;var n=e;return K.test(t)||!V.test(t)?n=parseInt(t,10):V.test(t)&&(n=1e3*parseFloat(t)),0>n&&(n=0),n===n?n:e}function c(t){for(var i=-1,e=t?t.length:0,n=[];e>++i;){var r=t[i];r&&n.push(r)}return n}var h=function(t,i,e){function n(t){return"object"==typeof t}function r(t){return"function"==typeof t}function s(){}function a(o,u){function c(){var t=new h;return r(t.init)&&t.init.apply(t,arguments),t}function h(){}u===e&&(u=o,o=Object),c.Bare=h;var l,f=s[t]=o[t],d=h[t]=c[t]=new s;return d.constructor=c,c.mixin=function(i){return h[t]=c[t]=a(c,i)[t],c},c.open=function(t){if(l={},r(t)?l=t.call(c,d,f,c,o):n(t)&&(l=t),n(l))for(var e in l)i.call(l,e)&&(d[e]=l[e]);return r(d.init)||(d.init=o),c},c.open(u)}return a}("prototype",{}.hasOwnProperty),l={ease:["ease",function(t,i,e,n){var r=(t/=n)*t,s=r*t;return i+e*(-2.75*s*r+11*r*r+-15.5*s+8*r+.25*t)}],"ease-in":["ease-in",function(t,i,e,n){var r=(t/=n)*t,s=r*t;return i+e*(-1*s*r+3*r*r+-3*s+2*r)}],"ease-out":["ease-out",function(t,i,e,n){var r=(t/=n)*t,s=r*t;return i+e*(.3*s*r+-1.6*r*r+2.2*s+-1.8*r+1.9*t)}],"ease-in-out":["ease-in-out",function(t,i,e,n){var r=(t/=n)*t,s=r*t;return i+e*(2*s*r+-5*r*r+2*s+2*r)}],linear:["linear",function(t,i,e,n){return e*t/n+i}],"ease-in-quad":["cubic-bezier(0.550, 0.085, 0.680, 0.530)",function(t,i,e,n){return e*(t/=n)*t+i}],"ease-out-quad":["cubic-bezier(0.250, 0.460, 0.450, 0.940)",function(t,i,e,n){return-e*(t/=n)*(t-2)+i}],"ease-in-out-quad":["cubic-bezier(0.455, 0.030, 0.515, 0.955)",function(t,i,e,n){return 1>(t/=n/2)?e/2*t*t+i:-e/2*(--t*(t-2)-1)+i}],"ease-in-cubic":["cubic-bezier(0.550, 0.055, 0.675, 0.190)",function(t,i,e,n){return e*(t/=n)*t*t+i}],"ease-out-cubic":["cubic-bezier(0.215, 0.610, 0.355, 1)",function(t,i,e,n){return e*((t=t/n-1)*t*t+1)+i}],"ease-in-out-cubic":["cubic-bezier(0.645, 0.045, 0.355, 1)",function(t,i,e,n){return 1>(t/=n/2)?e/2*t*t*t+i:e/2*((t-=2)*t*t+2)+i}],"ease-in-quart":["cubic-bezier(0.895, 0.030, 0.685, 0.220)",function(t,i,e,n){return e*(t/=n)*t*t*t+i}],"ease-out-quart":["cubic-bezier(0.165, 0.840, 0.440, 1)",function(t,i,e,n){return-e*((t=t/n-1)*t*t*t-1)+i}],"ease-in-out-quart":["cubic-bezier(0.770, 0, 0.175, 1)",function(t,i,e,n){return 1>(t/=n/2)?e/2*t*t*t*t+i:-e/2*((t-=2)*t*t*t-2)+i}],"ease-in-quint":["cubic-bezier(0.755, 0.050, 0.855, 0.060)",function(t,i,e,n){return e*(t/=n)*t*t*t*t+i}],"ease-out-quint":["cubic-bezier(0.230, 1, 0.320, 1)",function(t,i,e,n){return e*((t=t/n-1)*t*t*t*t+1)+i}],"ease-in-out-quint":["cubic-bezier(0.860, 0, 0.070, 1)",function(t,i,e,n){return 1>(t/=n/2)?e/2*t*t*t*t*t+i:e/2*((t-=2)*t*t*t*t+2)+i}],"ease-in-sine":["cubic-bezier(0.470, 0, 0.745, 0.715)",function(t,i,e,n){return-e*Math.cos(t/n*(Math.PI/2))+e+i}],"ease-out-sine":["cubic-bezier(0.390, 0.575, 0.565, 1)",function(t,i,e,n){return e*Math.sin(t/n*(Math.PI/2))+i}],"ease-in-out-sine":["cubic-bezier(0.445, 0.050, 0.550, 0.950)",function(t,i,e,n){return-e/2*(Math.cos(Math.PI*t/n)-1)+i}],"ease-in-expo":["cubic-bezier(0.950, 0.050, 0.795, 0.035)",function(t,i,e,n){return 0===t?i:e*Math.pow(2,10*(t/n-1))+i}],"ease-out-expo":["cubic-bezier(0.190, 1, 0.220, 1)",function(t,i,e,n){return t===n?i+e:e*(-Math.pow(2,-10*t/n)+1)+i}],"ease-in-out-expo":["cubic-bezier(1, 0, 0, 1)",function(t,i,e,n){return 0===t?i:t===n?i+e:1>(t/=n/2)?e/2*Math.pow(2,10*(t-1))+i:e/2*(-Math.pow(2,-10*--t)+2)+i}],"ease-in-circ":["cubic-bezier(0.600, 0.040, 0.980, 0.335)",function(t,i,e,n){return-e*(Math.sqrt(1-(t/=n)*t)-1)+i}],"ease-out-circ":["cubic-bezier(0.075, 0.820, 0.165, 1)",function(t,i,e,n){return e*Math.sqrt(1-(t=t/n-1)*t)+i}],"ease-in-out-circ":["cubic-bezier(0.785, 0.135, 0.150, 0.860)",function(t,i,e,n){return 1>(t/=n/2)?-e/2*(Math.sqrt(1-t*t)-1)+i:e/2*(Math.sqrt(1-(t-=2)*t)+1)+i}],"ease-in-back":["cubic-bezier(0.600, -0.280, 0.735, 0.045)",function(t,i,e,n,r){return void 0===r&&(r=1.70158),e*(t/=n)*t*((r+1)*t-r)+i}],"ease-out-back":["cubic-bezier(0.175, 0.885, 0.320, 1.275)",function(t,i,e,n,r){return void 0===r&&(r=1.70158),e*((t=t/n-1)*t*((r+1)*t+r)+1)+i}],"ease-in-out-back":["cubic-bezier(0.680, -0.550, 0.265, 1.550)",function(t,i,e,n,r){return void 0===r&&(r=1.70158),1>(t/=n/2)?e/2*t*t*(((r*=1.525)+1)*t-r)+i:e/2*((t-=2)*t*(((r*=1.525)+1)*t+r)+2)+i}]},f={"ease-in-back":"cubic-bezier(0.600, 0, 0.735, 0.045)","ease-out-back":"cubic-bezier(0.175, 0.885, 0.320, 1)","ease-in-out-back":"cubic-bezier(0.680, 0, 0.265, 1)"},d=document,p=window,b="bkwld-tram",m=/[\-\.0-9]/g,v=/[A-Z]/,g="number",y=/^(rgb|#)/,w=/(em|cm|mm|in|pt|pc|px)$/,k=/(em|cm|mm|in|pt|pc|px|%)$/,x=/(deg|rad|turn)$/,z="unitless",q=/(all|none) 0s ease 0s/,$=/^(width|height)$/,M=" ",A=d.createElement("a"),B=["Webkit","Moz","O","ms"],R=["-webkit-","-moz-","-o-","-ms-"],F=function(t){if(t in A.style)return{dom:t,css:t};var i,e,n="",r=t.split("-");for(i=0;r.length>i;i++)n+=r[i].charAt(0).toUpperCase()+r[i].slice(1);for(i=0;B.length>i;i++)if(e=B[i]+n,e in A.style)return{dom:e,css:R[i]+t}},S=i.support={bind:Function.prototype.bind,transform:F("transform"),transition:F("transition"),backface:F("backface-visibility"),timing:F("transition-timing-function")};if(S.transition){var j=S.timing.dom;if(A.style[j]=l["ease-in-back"][0],!A.style[j])for(var I in f)l[I][0]=f[I]}var G=i.frame=function(){var t=p.requestAnimationFrame||p.webkitRequestAnimationFrame||p.mozRequestAnimationFrame||p.oRequestAnimationFrame||p.msRequestAnimationFrame;return t&&S.bind?t.bind(p):function(t){p.setTimeout(t,16)}}(),T=i.now=function(){var t=p.performance,i=t&&(t.now||t.webkitNow||t.msNow||t.mozNow);return i&&S.bind?i.bind(t):Date.now||function(){return+new Date}}(),U=h(function(i){function n(t,i){var e=c((""+t).split(M)),n=e[0];i=i||{};var r=W[n];if(!r)return _("Unsupported property: "+n);if(!i.weak||!this.props[n]){var s=r[0],a=this.props[n];return a||(a=this.props[n]=new s.Bare),a.init(this.$el,e,r,i),a}}function r(t,i,e){if(t){var r=typeof t;if(i||(this.timer&&this.timer.destroy(),this.queue=[],this.active=!1),"number"==r&&i)return this.timer=new Y({duration:t,context:this,complete:o}),this.active=!0,void 0;if("string"==r&&i){switch(t){case"hide":d.call(this);break;case"stop":h.call(this);break;case"redraw":p.call(this);break;default:n.call(this,t,e&&e[1])}return o.call(this)}if("function"==r)return t.call(this,this),void 0;if("object"==r){var s=0;m.call(this,t,function(t,i){t.span>s&&(s=t.span),t.stop(),t.animate(i)},function(t){"wait"in t&&(s=u(t.wait,0))}),b.call(this),s>0&&(this.timer=new Y({duration:s,context:this}),this.active=!0,i&&(this.timer.complete=o));var a=this,c=!1,l={};G(function(){m.call(a,t,function(t){t.active&&(c=!0,l[t.name]=t.nextStyle)}),c&&a.$el.css(l)})}}}function s(t){t=u(t,0),this.active?this.queue.push({options:t}):(this.timer=new Y({duration:t,context:this,complete:o}),this.active=!0)}function a(t){return this.active?(this.queue.push({options:t,args:arguments}),this.timer.complete=o,void 0):_("No active transition timer. Use start() or wait() before then().")}function o(){if(this.timer&&this.timer.destroy(),this.active=!1,this.queue.length){var t=this.queue.shift();r.call(this,t.options,!0,t.args)}}function h(t){this.timer&&this.timer.destroy(),this.queue=[],this.active=!1;var i;"string"==typeof t?(i={},i[t]=1):i="object"==typeof t&&null!=t?t:this.props,m.call(this,i,g),b.call(this)}function l(t){h.call(this,t),m.call(this,t,y,w)}function f(t){"string"!=typeof t&&(t="block"),this.el.style.display=t}function d(){h.call(this),this.el.style.display="none"}function p(){this.el.offsetHeight}function b(){var t,i,e=[];this.upstream&&e.push(this.upstream);for(t in this.props)i=this.props[t],i.active&&e.push(i.string);e=e.join(","),this.style!==e&&(this.style=e,this.el.style[S.transition.dom]=e)}function m(t,i,r){var s,a,o,u,c=i!==g,h={};for(s in t)o=t[s],s in J?(h.transform||(h.transform={}),h.transform[s]=o):(v.test(s)&&(s=e(s)),s in W?h[s]=o:(u||(u={}),u[s]=o));for(s in h){if(o=h[s],a=this.props[s],!a){if(!c)continue;a=n.call(this,s)}i.call(this,a,o)}r&&u&&r.call(this,u)}function g(t){t.stop()}function y(t,i){t.set(i)}function w(t){this.$el.css(t)}function k(t,e){i[t]=function(){return this.children?x.call(this,e,arguments):(this.el&&e.apply(this,arguments),this)}}function x(t,i){var e,n=this.children.length;for(e=0;n>e;e++)t.apply(this.children[e],i);return this}i.init=function(i){if(this.$el=t(i),this.el=this.$el[0],this.props={},this.queue=[],this.style="",this.active=!1,C.keepInherited&&!C.fallback){var e=L(this.el,"transition");e&&!q.test(e)&&(this.upstream=e)}S.backface&&C.hideBackface&&D(this.el,S.backface.css,"hidden")},k("add",n),k("start",r),k("wait",s),k("then",a),k("next",o),k("stop",h),k("set",l),k("show",f),k("hide",d),k("redraw",p)}),Z=h(U,function(i){function e(i,e){var n=t.data(i,b)||t.data(i,b,new U.Bare);return n.el||n.init(i),e?n.start(e):n}i.init=function(i,n){var r=t(i);if(!r.length)return this;if(1===r.length)return e(r[0],n);var s=[];return r.each(function(t,i){s.push(e(i,n))}),this.children=s,this}}),H=h(function(t){function i(){var t=this.get();this.update("auto");var i=this.get();return this.update(t),i}function e(t,i,e){return void 0!==i&&(e=i),t in l?t:e}function n(t){var i=/rgba?\((\d+),\s*(\d+),\s*(\d+)/.exec(t);return(i?r(i[1],i[2],i[3]):t).replace(/#(\w)(\w)(\w)$/,"#$1$1$2$2$3$3")}var s={duration:500,ease:"ease",delay:0};t.init=function(t,i,n,r){this.$el=t,this.el=t[0];var a=i[0];n[2]&&(a=n[2]),Q[a]&&(a=Q[a]),this.name=a,this.type=n[1],this.duration=u(i[1],this.duration,s.duration),this.ease=e(i[2],this.ease,s.ease),this.delay=u(i[3],this.delay,s.delay),this.span=this.duration+this.delay,this.active=!1,this.nextStyle=null,this.auto=$.test(this.name),this.unit=r.unit||this.unit||C.defaultUnit,this.angle=r.angle||this.angle||C.defaultAngle,C.fallback||r.fallback?this.animate=this.fallback:(this.animate=this.transition,this.string=this.name+M+this.duration+"ms"+("ease"!=this.ease?M+l[this.ease][0]:"")+(this.delay?M+this.delay+"ms":""))},t.set=function(t){t=this.convert(t,this.type),this.update(t),this.redraw()},t.transition=function(t){this.active=!0,t=this.convert(t,this.type),this.auto&&("auto"==this.el.style[this.name]&&(this.update(this.get()),this.redraw()),"auto"==t&&(t=i.call(this))),this.nextStyle=t},t.fallback=function(t){var e=this.el.style[this.name]||this.convert(this.get(),this.type);t=this.convert(t,this.type),this.auto&&("auto"==e&&(e=this.convert(this.get(),this.type)),"auto"==t&&(t=i.call(this))),this.tween=new X({from:e,to:t,duration:this.duration,delay:this.delay,ease:this.ease,update:this.update,context:this})},t.get=function(){return L(this.el,this.name)},t.update=function(t){D(this.el,this.name,t)},t.stop=function(){(this.active||this.nextStyle)&&(this.active=!1,this.nextStyle=null,D(this.el,this.name,this.get()));var t=this.tween;t&&t.context&&t.destroy()},t.convert=function(t,i){if("auto"==t&&this.auto)return t;var e,r="number"==typeof t,s="string"==typeof t;switch(i){case g:if(r)return t;if(s&&""===t.replace(m,""))return+t;e="number(unitless)";break;case y:if(s){if(""===t&&this.original)return this.original;if(i.test(t))return"#"==t.charAt(0)&&7==t.length?t:n(t)}e="hex or rgb string";break;case w:if(r)return t+this.unit;if(s&&i.test(t))return t;e="number(px) or string(unit)";break;case k:if(r)return t+this.unit;if(s&&i.test(t))return t;e="number(px) or string(unit or %)";break;case x:if(r)return t+this.angle;if(s&&i.test(t))return t;e="number(deg) or string(angle)";break;case z:if(r)return t;if(s&&k.test(t))return t;e="number(unitless) or string(unit or %)"}return a(e,t),t},t.redraw=function(){this.el.offsetHeight}}),N=h(H,function(t,i){t.init=function(){i.init.apply(this,arguments),this.original||(this.original=this.convert(this.get(),y))}}),O=h(H,function(t,i){t.init=function(){i.init.apply(this,arguments),this.animate=this.fallback},t.get=function(){return this.$el[this.name]()},t.update=function(t){this.$el[this.name](t)}}),P=h(H,function(t,i){function e(t,i){var e,n,r,s,a;for(e in t)s=J[e],r=s[0],n=s[1]||e,a=this.convert(t[e],r),i.call(this,n,a,r)}t.init=function(){i.init.apply(this,arguments),this.current||(this.current={},J.perspective&&C.perspective&&(this.current.perspective=C.perspective,D(this.el,this.name,this.style(this.current)),this.redraw()))},t.set=function(t){e.call(this,t,function(t,i){this.current[t]=i}),D(this.el,this.name,this.style(this.current)),this.redraw()},t.transition=function(t){var i=this.values(t);this.tween=new E({current:this.current,values:i,duration:this.duration,delay:this.delay,ease:this.ease});var e,n={};for(e in this.current)n[e]=e in i?i[e]:this.current[e];this.active=!0,this.nextStyle=this.style(n)},t.fallback=function(t){var i=this.values(t);this.tween=new E({current:this.current,values:i,duration:this.duration,delay:this.delay,ease:this.ease,update:this.update,context:this})},t.update=function(){D(this.el,this.name,this.style(this.current))},t.style=function(t){var i,e="";for(i in t)e+=i+"("+t[i]+") ";return e},t.values=function(t){var i,n={};return e.call(this,t,function(t,e,r){n[t]=e,void 0===this.current[t]&&(i=0,~t.indexOf("scale")&&(i=1),this.current[t]=this.convert(i,r))}),n}}),X=h(function(i){function e(t){1===d.push(t)&&G(a)}function a(){var t,i,e,n=d.length;if(n)for(G(a),i=T(),t=n;t--;)e=d[t],e&&e.render(i)}function u(i){var e,n=t.inArray(i,d);n>=0&&(e=d.slice(n+1),d.length=n,e.length&&(d=d.concat(e)))}function c(t){return Math.round(t*p)/p}function h(t,i,e){return r(t[0]+e*(i[0]-t[0]),t[1]+e*(i[1]-t[1]),t[2]+e*(i[2]-t[2]))}var f={ease:l.ease[1],from:0,to:1};i.init=function(t){this.duration=t.duration||0,this.delay=t.delay||0;var i=t.ease||f.ease;l[i]&&(i=l[i][1]),"function"!=typeof i&&(i=f.ease),this.ease=i,this.update=t.update||s,this.complete=t.complete||s,this.context=t.context||this,this.name=t.name;var e=t.from,n=t.to;void 0===e&&(e=f.from),void 0===n&&(n=f.to),this.unit=t.unit||"","number"==typeof e&&"number"==typeof n?(this.begin=e,this.change=n-e):this.format(n,e),this.value=this.begin+this.unit,this.start=T(),t.autoplay!==!1&&this.play()},i.play=function(){this.active||(this.start||(this.start=T()),this.active=!0,e(this))},i.stop=function(){this.active&&(this.active=!1,u(this))},i.render=function(t){var i,e=t-this.start;if(this.delay){if(this.delay>=e)return;e-=this.delay}if(this.duration>e){var n=this.ease(e,0,1,this.duration);return i=this.startRGB?h(this.startRGB,this.endRGB,n):c(this.begin+n*this.change),this.value=i+this.unit,this.update.call(this.context,this.value),void 0}i=this.endHex||this.begin+this.change,this.value=i+this.unit,this.update.call(this.context,this.value),this.complete.call(this.context),this.destroy()},i.format=function(t,i){if(i+="",t+="","#"==t.charAt(0))return this.startRGB=n(i),this.endRGB=n(t),this.endHex=t,this.begin=0,this.change=1,void 0;if(!this.unit){var e=i.replace(m,""),r=t.replace(m,"");e!==r&&o("tween",i,t),this.unit=e}i=parseFloat(i),t=parseFloat(t),this.begin=this.value=i,this.change=t-i},i.destroy=function(){this.stop(),this.context=null,this.ease=this.update=this.complete=s};var d=[],p=1e3}),Y=h(X,function(t){t.init=function(t){this.duration=t.duration||0,this.complete=t.complete||s,this.context=t.context,this.play()},t.render=function(t){var i=t-this.start;this.duration>i||(this.complete.call(this.context),this.destroy())}}),E=h(X,function(t,i){t.init=function(t){this.context=t.context,this.update=t.update,this.tweens=[],this.current=t.current;var i,e;for(i in t.values)e=t.values[i],this.current[i]!==e&&this.tweens.push(new X({name:i,from:this.current[i],to:e,duration:t.duration,delay:t.delay,ease:t.ease,autoplay:!1}));this.play()},t.render=function(t){var i,e,n=this.tweens.length,r=!1;for(i=n;i--;)e=this.tweens[i],e.context&&(e.render(t),this.current[e.name]=e.value,r=!0);return r?(this.update&&this.update.call(this.context),void 0):this.destroy()},t.destroy=function(){if(i.destroy.call(this),this.tweens){var t,e=this.tweens.length;for(t=e;t--;)this.tweens[t].destroy();this.tweens=null,this.current=null}}}),C=i.config={defaultUnit:"px",defaultAngle:"deg",keepInherited:!1,hideBackface:!1,perspective:"",fallback:!S.transition,agentTests:[]};i.fallback=function(t){if(!S.transition)return C.fallback=!0;C.agentTests.push("("+t+")");var i=RegExp(C.agentTests.join("|"),"i");C.fallback=i.test(navigator.userAgent)},i.fallback("6.0.[2-5] Safari"),i.tween=function(t){return new X(t)},i.delay=function(t,i,e){return new Y({complete:i,duration:t,context:e})},t.fn.tram=function(t){return i.call(null,this,t)};var D=t.style,L=t.css,Q={transform:S.transform&&S.transform.css},W={color:[N,y],background:[N,y,"background-color"],"outline-color":[N,y],"border-color":[N,y],"border-top-color":[N,y],"border-right-color":[N,y],"border-bottom-color":[N,y],"border-left-color":[N,y],"border-width":[H,w],"border-top-width":[H,w],"border-right-width":[H,w],"border-bottom-width":[H,w],"border-left-width":[H,w],"border-spacing":[H,w],"letter-spacing":[H,w],margin:[H,w],"margin-top":[H,w],"margin-right":[H,w],"margin-bottom":[H,w],"margin-left":[H,w],padding:[H,w],"padding-top":[H,w],"padding-right":[H,w],"padding-bottom":[H,w],"padding-left":[H,w],"outline-width":[H,w],opacity:[H,g],top:[H,k],right:[H,k],bottom:[H,k],left:[H,k],"font-size":[H,k],"text-indent":[H,k],"word-spacing":[H,k],width:[H,k],"min-width":[H,k],"max-width":[H,k],height:[H,k],"min-height":[H,k],"max-height":[H,k],"line-height":[H,z],"scroll-top":[O,g,"scrollTop"],"scroll-left":[O,g,"scrollLeft"]},J={};S.transform&&(W.transform=[P],J={x:[k,"translateX"],y:[k,"translateY"],rotate:[x],rotateX:[x],rotateY:[x],scale:[g],scaleX:[g],scaleY:[g],skew:[x],skewX:[x],skewY:[x]}),S.transform&&S.backface&&(J.z=[k,"translateZ"],J.rotateZ=[x],J.scaleZ=[g],J.perspective=[w]);var K=/ms/,V=/s|\./,_=function(){var t="warn",i=window.console;return i&&i[t]?function(e){i[t](e)}:s}();return t.tram=i}(window.jQuery);/*!
 * jQuery-ajaxTransport-XDomainRequest - v1.0.1 - 2013-10-17
 * https://github.com/MoonScript/jQuery-ajaxTransport-XDomainRequest
 * Copyright (c) 2013 Jason Moon (@JSONMOON)
 * Licensed MIT (/blob/master/LICENSE.txt)
 */
(function($){if(!$.support.cors&&$.ajaxTransport&&window.XDomainRequest){var n=/^https?:\/\//i;var o=/^get|post$/i;var p=new RegExp('^'+location.protocol,'i');var q=/text\/html/i;var r=/\/json/i;var s=/\/xml/i;$.ajaxTransport('* text html xml json',function(i,j,k){if(i.crossDomain&&i.async&&o.test(i.type)&&n.test(i.url)&&p.test(i.url)){var l=null;var m=(j.dataType||'').toLowerCase();return{send:function(f,g){l=new XDomainRequest();if(/^\d+$/.test(j.timeout)){l.timeout=j.timeout}l.ontimeout=function(){g(500,'timeout')};l.onload=function(){var a='Content-Length: '+l.responseText.length+'\r\nContent-Type: '+l.contentType;var b={code:200,message:'success'};var c={text:l.responseText};try{if(m==='html'||q.test(l.contentType)){c.html=l.responseText}else if(m==='json'||(m!=='text'&&r.test(l.contentType))){try{c.json=$.parseJSON(l.responseText)}catch(e){b.code=500;b.message='parseerror'}}else if(m==='xml'||(m!=='text'&&s.test(l.contentType))){var d=new ActiveXObject('Microsoft.XMLDOM');d.async=false;try{d.loadXML(l.responseText)}catch(e){d=undefined}if(!d||!d.documentElement||d.getElementsByTagName('parsererror').length){b.code=500;b.message='parseerror';throw'Invalid XML: '+l.responseText;}c.xml=d}}catch(parseMessage){throw parseMessage;}finally{g(b.code,b.message,c,a)}};l.onprogress=function(){};l.onerror=function(){g(500,'error',{text:l.responseText})};var h='';if(j.data){h=($.type(j.data)==='string')?j.data:$.param(j.data)}l.open(i.type,i.url);l.send(h)},abort:function(){if(l){l.abort()}}}}})}})(jQuery);
/*!
 * tap.js
 * Copyright (c) 2013 Alex Gibson, http://alxgbsn.co.uk/
 * Released under MIT license
 */
(function (window, document) {

    'use strict';

    function Tap(el) {
        el = typeof el === 'object' ? el : document.getElementById(el);
        this.element = el;
        this.moved = false; //flags if the finger has moved
        this.startX = 0; //starting x coordinate
        this.startY = 0; //starting y coordinate
        this.hasTouchEventOccured = false; //flag touch event
        el.addEventListener('touchstart', this, false);
        el.addEventListener('touchmove', this, false);
        el.addEventListener('touchend', this, false);
        el.addEventListener('touchcancel', this, false);
        el.addEventListener('mousedown', this, false);
        el.addEventListener('mouseup', this, false);
    }

    Tap.prototype.start = function (e) {
        if (e.type === 'touchstart') {
            this.hasTouchEventOccured = true;
        }
        this.moved = false;
        this.startX = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
        this.startY = e.type === 'touchstart' ? e.touches[0].clientY : e.clientY;
    };

    Tap.prototype.move = function (e) {
        //if finger moves more than 10px flag to cancel
        if (Math.abs(e.touches[0].clientX - this.startX) > 10 || Math.abs(e.touches[0].clientY - this.startY) > 10) {
            this.moved = true;
        }
    };

    Tap.prototype.end = function (e) {
        var evt;

        if (this.hasTouchEventOccured && e.type === 'mouseup') {
            e.preventDefault();
            e.stopPropagation();
            this.hasTouchEventOccured = false;
            return;
        }

        if (!this.moved) {
            //create custom event
            if (typeof document.CustomEvent !== "undefined") {
                evt = new document.CustomEvent('tap', {
                    bubbles: true,
                    cancelable: true
                });
            } else {
                evt = document.createEvent('Event');
                evt.initEvent('tap', true, true);
            }
            e.target.dispatchEvent(evt);
        }
    };

    Tap.prototype.cancel = function (e) {
        this.hasTouchEventOccured = false;
        this.moved = false;
        this.startX = 0;
        this.startY = 0;
    };

    Tap.prototype.destroy = function () {
        var el = this.element;
        el.removeEventListener('touchstart', this, false);
        el.removeEventListener('touchmove', this, false);
        el.removeEventListener('touchend', this, false);
        el.removeEventListener('touchcancel', this, false);
        el.removeEventListener('mousedown', this, false);
        el.removeEventListener('mouseup', this, false);
        this.element = null;
    };

    Tap.prototype.handleEvent = function (e) {
        switch (e.type) {
        case 'touchstart': this.start(e); break;
        case 'touchmove': this.move(e); break;
        case 'touchend': this.end(e); break;
        case 'touchcancel': this.cancel(e); break;
        case 'mousedown': this.start(e); break;
        case 'mouseup': this.end(e); break;
        }
    };

    window.Tap = Tap;

}(window, document));
/* jshint ignore:end */
/**
 * ----------------------------------------------------------------------
 * Init lib after plugins
 */
Webflow.init();
/**
 * ----------------------------------------------------------------------
 * Webflow: Touch events for jQuery based on tap.js
 */
Webflow.define('touch', function ($, _) {
  'use strict';

  var Tap = window.Tap;
  var namespace = '.w-events-';
  var dataKey = namespace + 'tap';
  var fallback = !document.addEventListener;

  // jQuery event "tap" - use click in old + non-touch browsers
  $.event.special.tap = (fallback || !Webflow.env.touch) ? { bindType: 'click', delegateType: 'click' } : {
    setup: function () {
      $.data(this, dataKey, new Tap(this));
    },
    teardown: function () {
      var tap = $.data(this, dataKey);
      if (tap && tap.destroy) {
        tap.destroy();
        $.removeData(this, dataKey);
      }
    },
    add: function (handleObj) {
      this.addEventListener('tap', handleObj.handler, false);
    },
    remove: function (handleObj) {
      this.removeEventListener('tap', handleObj.handler, false);
    }
  };

  // No swipe events for old browsers
  if (fallback || !Object.create) return;

  // jQuery event "swipe"
  dataKey = namespace + 'swipe';

  $.event.special.swipe = {
    setup: function () {
      $.data(this, dataKey, new Swipe(this));
    },
    teardown: function () {
      var tap = $.data(this, dataKey);
      if (tap && tap.destroy) {
        tap.destroy();
        $.removeData(this, dataKey);
      }
    },
    add: function (handleObj) {
      this.addEventListener('swipe', handleObj.handler, false);
    },
    remove: function (handleObj) {
      this.removeEventListener('swipe', handleObj.handler, false);
    }
  };

  /**
   * Swipe - extends Tap, supports mouse swipes!
   */
  function Swipe(el) {
    Tap.call(this, el);
  }

  (function () {
    var supr = Tap.prototype;
    var proto = Swipe.prototype = Object.create(supr);
    var threshold = Math.round(screen.width * 0.04) || 20;
    if (threshold > 40) threshold = 40;

    proto.start = function (e) {
      supr.start.call(this, e);
      this.element.addEventListener('mousemove', this, false);
      document.addEventListener('mouseup', this, false);
      this.velocityX = 0;
      this.lastX = this.startX;
      this.enabled = true;
    };

    proto.move = _.throttle(function (e) {
      if (!this.enabled) return;
      var x = e.touches ? e.touches[0].clientX : e.clientX;
      this.velocityX = x - this.lastX;
      this.lastX = x;
      if (Math.abs(this.velocityX) > threshold) {
        this.end(e);
      }
    });

    proto.end = function (e) {
      if (!this.enabled) return;
      var velocityX = this.velocityX;
      this.cancel();
      if (Math.abs(velocityX) > threshold) {
        $(this.element).triggerHandler('swipe', { direction: velocityX > 0 ? 'right' : 'left' });
      }
    };

    proto.destroy = function () {
      this.cancel();
      supr.destroy.call(this);
    };

    proto.cancel = function () {
      this.enabled = false;
      this.element.removeEventListener('mousemove', this, false);
      document.removeEventListener('mouseup', this, false);
      supr.cancel.call(this);
    };

    proto.handleEvent = function (e) {
      if (e.type == 'mousemove') return this.move(e);
      supr.handleEvent.call(this, e);
    };
  }());

});

/**
 * ----------------------------------------------------------------------
 * Webflow: Auto-select links to current page or section
 */
Webflow.define('links', function ($, _) {
  'use strict';

  var api = {};
  var $win = $(window);
  var designer;
  var inApp = Webflow.env();
  var location = window.location;
  var linkCurrent = 'w--current';
  var validHash = /^#[a-zA-Z][\w:.-]*$/;
  var indexPage = /index\.(html|php)$/;
  var dirList = /\/$/;
  var anchors;

  // -----------------------------------
  // Module methods

  api.ready = api.design = api.preview = init;

  // -----------------------------------
  // Private methods

  function init() {
    designer = inApp && Webflow.env('design');

    // Reset scroll listener, init anchors
    Webflow.scroll.off(scroll);
    anchors = [];

    // Test all links for a selectable href
    var links = document.links;
    for (var i = 0; i < links.length; ++i) {
      select(links[i]);
    }

    // Listen for scroll if any anchors exist
    if (anchors.length) {
      Webflow.scroll.on(scroll);
      scroll();
    }
  }

  function select(link) {
    var href = link.getAttribute('href');

    // Ignore any hrefs with a colon to safely avoid all uri schemes
    if (href.indexOf(':') >= 0) return;

    var $link = $(link);

    // Check for valid hash links w/ sections and use scroll anchor
    if (href.indexOf('#') === 0 && validHash.test(href)) {
      var $section = $(href);
      $section.length && anchors.push({ link: $link, sec: $section, active: false });
      return;
    }

    // Determine whether the link should be selected
    var slug = (inApp ? Webflow.env('slug') : location.pathname) || '';
    var match = (link.href === location.href) || (href === slug) || (indexPage.test(href) && dirList.test(slug));
    setClass($link, linkCurrent, match);
  }

  function scroll() {
    var viewTop = $win.scrollTop();
    var viewHeight = $win.height();

    // Check each anchor for a section in view
    _.each(anchors, function (anchor) {
      var $link = anchor.link;
      var $section = anchor.sec;
      var top = $section.offset().top;
      var height = $section.outerHeight();
      var offset = viewHeight * 0.5;
      var active = ($section.is(':visible') &&
        top + height - offset >= viewTop &&
        top + offset <= viewTop + viewHeight);
      if (anchor.active === active) return;
      anchor.active = active;
      setClass($link, linkCurrent, active);
      if (designer) $link[0].__wf_current = active;
    });
  }

  function setClass($elem, className, add) {
    var exists = $elem.hasClass(className);
    if (add && exists) return;
    if (!add && !exists) return;
    add ? $elem.addClass(className) : $elem.removeClass(className);
  }

  // Export module
  return api;
});

/**
 * ----------------------------------------------------------------------
 * Webflow: Interactions
 */
Webflow.define('ix', function ($, _) {
  'use strict';

  var api = {};
  var designer;
  var $win = $(window);
  var namespace = '.w-ix';
  var tram = window.tram;
  var env = Webflow.env;
  var ios = env.ios;
  var inApp = env();
  var emptyFix = env.chrome && env.chrome < 35;
  var transNone = 'none 0s ease 0s';
  var introEvent = 'w-ix-intro';
  var outroEvent = 'w-ix-outro';
  var config = {};
  var anchors = [];
  var loads = [];
  var readys = [];
  var unique = 0;
  var store;

  // -----------------------------------
  // Module methods

  api.init = function (list) {
    setTimeout(function () { init(list); }, 1);
  };

  api.preview = function () {
    designer = false;
    setTimeout(function () { init(window.__wf_ix); }, 1);
  };

  api.design = function () {
    designer = true;
    $('[data-ix]').each(teardown);
    Webflow.scroll.off(scroll);
    anchors = [];
    loads = [];
    readys = [];
  };

  api.run = run;
  api.style = inApp ? styleApp : stylePub;

  // -----------------------------------
  // Private methods

  function init(list) {
    if (!list) return;
    store = {};

    // Map all interactions to a hash using slug as key.
    config = {};
    _.each(list, function (item) {
      config[item.slug] = item.value;
    });

    // Build each element's interaction keying from data attribute
    var els = $('[data-ix]');
    els.each(teardown);
    els.each(build);

    // Listen for scroll events if any anchors exist
    if (anchors.length) {
      Webflow.scroll.on(scroll);
      setTimeout(scroll, 1);
    }

    // Handle loads or readys if they exist
    if (loads.length) $win.on('load', runLoads);
    if (readys.length) setTimeout(runReadys, 1);

    // Trigger event for other modules
    $win.triggerHandler('ix-ready.webflow');
  }

  function build(i, el) {

    var $el = $(el);
    var id = $el.attr('data-ix');
    var ix = config[id];
    if (!ix) return;
    var triggers = ix.triggers;
    if (!triggers) return;
    var state = store[id] || (store[id] = {});

    // Set initial styles, unless we detect an iOS device + any non-iOS triggers
    var setStyles = !(ios && _.any(triggers, isNonIOS));
    if (setStyles) api.style($el, ix.style);

    _.each(triggers, function (trigger) {
      var type = trigger.type;
      var stepsB = trigger.stepsB && trigger.stepsB.length;

      function runA() { run(trigger, $el, { group: 'A' }); }
      function runB() { run(trigger, $el, { group: 'B' }); }

      if (type == 'load') {
        (trigger.preload && !inApp) ? loads.push(runA) : readys.push(runA);
        return;
      }

      if (type == 'click') {
        var stateKey = 'click:' + unique++;
        if (trigger.descend) stateKey += ':descend';
        if (trigger.siblings) stateKey += ':siblings';
        if (trigger.selector) stateKey += ':' + trigger.selector;

        $el.on('click' + namespace, function (evt) {
          if ($el.attr('href') === '#') evt.preventDefault();

          run(trigger, $el, { group: state[stateKey] ? 'B' : 'A' });
          if (stepsB) state[stateKey] = !state[stateKey];
        });
        return;
      }

      if (type == 'hover') {
        $el.on('mouseenter' + namespace, runA);
        $el.on('mouseleave' + namespace, runB);
        return;
      }

      if (type == 'tabs') {
        $el.closest('.w-tab-link, .w-tab-pane').on(introEvent, runA).on(outroEvent, runB);
        return;
      }

      if (type == 'slider') {
        $el.closest('.w-slide').on(introEvent, runA).on(outroEvent, runB);
        return;
      }

      // Ignore the following triggers on iOS devices
      if (ios) return;

      if (type == 'scroll') {
        anchors.push({
          el: $el, trigger: trigger, state: { active: false },
          offsetTop: convert(trigger.offsetTop),
          offsetBot: convert(trigger.offsetBot)
        });
        return;
      }
    });
  }

  function isNonIOS(trigger) {
    return trigger.type == 'scroll';
  }

  function convert(offset) {
    if (!offset) return 0;
    offset = offset + '';
    var result = parseInt(offset, 10);
    if (result !== result) return 0;
    if (offset.indexOf('%') > 0) {
      result = result / 100;
      if (result >= 1) result = 0.999;
    }
    return result;
  }

  function teardown(i, el) {
    $(el).off(namespace);
  }

  function scroll() {
    var viewTop = $win.scrollTop();
    var viewHeight = $win.height();

    // Check each anchor for a valid scroll trigger
    var count = anchors.length;
    for (var i = 0; i < count; i++) {
      var anchor = anchors[i];
      var $el = anchor.el;
      var trigger = anchor.trigger;
      var stepsB = trigger.stepsB && trigger.stepsB.length;
      var state = anchor.state;
      var top = $el.offset().top;
      var height = $el.outerHeight();
      var offsetTop = anchor.offsetTop;
      var offsetBot = anchor.offsetBot;
      if (offsetTop < 1 && offsetTop > 0) offsetTop *= viewHeight;
      if (offsetBot < 1 && offsetBot > 0) offsetBot *= viewHeight;
      var active = (top + height - offsetTop >= viewTop && top + offsetBot <= viewTop + viewHeight);
      if (active === state.active) continue;
      if (active === false && !stepsB) continue;
      state.active = active;
      run(trigger, $el, { group: active ? 'A' : 'B' });
    }
  }

  function runLoads() {
    var count = loads.length;
    for (var i = 0; i < count; i++) {
      loads[i]();
    }
  }

  function runReadys() {
    var count = readys.length;
    for (var i = 0; i < count; i++) {
      readys[i]();
    }
  }

  function run(trigger, $el, opts, replay) {
    opts = opts || {};
    var done = opts.done;

    // Do not run in designer unless forced
    if (designer && !opts.force) return;

    // Operate on a set of grouped steps
    var group = opts.group || 'A';
    var loop = trigger['loop' + group];
    var steps = trigger['steps' + group];
    if (!steps || !steps.length) return;
    if (steps.length < 2) loop = false;

    // One-time init before any loops
    if (!replay) {

      // Find selector within element descendants, siblings, or query whole document
      var selector = trigger.selector;
      if (selector) {
        $el = (
          trigger.descend ? $el.find(selector) :
          trigger.siblings ? $el.siblings(selector) :
          $(selector)
        );
        if (inApp) $el.attr('data-ix-affect', 1);
      }

      // Apply empty fix for certain Chrome versions
      if (emptyFix) $el.addClass('w-ix-emptyfix');
    }

    var _tram = tram($el);

    // Add steps
    var meta = {};
    for (var i = 0; i < steps.length; i++) {
      addStep(_tram, steps[i], meta);
    }

    function fin() {
      // Run trigger again if looped
      if (loop) return run(trigger, $el, opts, true);

      // Reset any 'auto' values
      if (meta.width == 'auto') _tram.set({ width: 'auto' });
      if (meta.height == 'auto') _tram.set({ height: 'auto' });

      // Run callback
      done && done();
    }

    // Add final step to queue if tram has started
    meta.start ? _tram.then(fin) : fin();
  }

  function addStep(_tram, step, meta) {
    var addMethod = 'add';
    var startMethod = 'start';

    // Once the transition has started, we will always use then() to add to the queue.
    if (meta.start) addMethod = startMethod = 'then';

    // Parse transitions string on the current step
    var transitions = step.transition;
    if (transitions) {
      transitions = transitions.split(',');
      for (var i = 0; i < transitions.length; i++) {
        _tram[addMethod](transitions[i]);
      }
    }

    // Build a clean object to pass to the tram method
    var clean = tramify(step) || {};

    // Store last width and height values
    if (clean.width != null) meta.width = clean.width;
    if (clean.height != null) meta.height = clean.height;

    // When transitions are not present, set values immediately and continue queue.
    if (transitions == null) {

      // If we have started, wrap set() in then() and reset queue
      if (meta.start) {
        _tram.then(function () {
          var queue = this.queue;
          this.set(clean);
          if (clean.display) {
            _tram.redraw();
            Webflow.redraw.up();
          }
          this.queue = queue;
          this.next();
        });
      } else {
        _tram.set(clean);

        // Always redraw after setting display
        if (clean.display) {
          _tram.redraw();
          Webflow.redraw.up();
        }
      }

      // Use the wait() method to kick off queue in absence of transitions.
      var wait = clean.wait;
      if (wait != null) {
        _tram.wait(wait);
        meta.start = true;
      }

    // Otherwise, when transitions are present
    } else {

      // If display is present, handle it separately
      if (clean.display) {
        var display = clean.display;
        delete clean.display;

        // If we've already started, we need to wrap it in a then()
        if (meta.start) {
          _tram.then(function () {
            var queue = this.queue;
            this.set({ display: display }).redraw();
            Webflow.redraw.up();
            this.queue = queue;
            this.next();
          });
        } else {
          _tram.set({ display: display }).redraw();
          Webflow.redraw.up();
        }
      }

      // Otherwise, start a transition using the current start method.
      _tram[startMethod](clean);
      meta.start = true;
    }
  }

  // (In app) Set styles immediately and manage upstream transition
  function styleApp(el, data) {
    var _tram = tram(el);

    // Get computed transition value
    el.css('transition', '');
    var computed = el.css('transition');

    // If computed is disabled, clear upstream
    if (computed === transNone) computed = _tram.upstream = null;

    // Disable upstream temporarily
    _tram.upstream = transNone;

    // Set values immediately
    _tram.set(tramify(data));

    // Only restore upstream in preview mode
    _tram.upstream = computed;
  }

  // (Published) Set styles immediately on specified jquery element
  function stylePub(el, data) {
    tram(el).set(tramify(data));
  }

  // Build a clean object for tram
  function tramify(obj) {
    var result = {};
    var found = false;
    for (var x in obj) {
      if (x === 'transition') continue;
      result[x] = obj[x];
      found = true;
    }
    // If empty, return null for tram.set/stop compliance
    return found ? result : null;
  }

  // Export module
  return api;
});
/**
 * ----------------------------------------------------------------------
 * Webflow: Interactions: Init
 */
Webflow.require('ix').init([
  {"slug":"logo-appearing","name":"Logo Appearing","value":{"style":{"opacity":0,"scale":1.5},"triggers":[{"type":"load","preload":true,"stepsA":[{"wait":700},{"opacity":1,"wait":700,"transition":"transform 500ms ease 0ms, opacity 500ms ease 0ms","scale":1}],"stepsB":[]}]}},
  {"slug":"content-appearing","name":"Content Appearing","value":{"style":{"opacity":0,"x":"0px","y":"100px"},"triggers":[{"type":"load","preload":true,"stepsA":[{"wait":1000},{"opacity":1,"transition":"transform 500ms ease 0ms, opacity 500ms ease 0ms","x":"0px","y":"0px"}],"stepsB":[]}]}},
  {"slug":"footer-appearing","name":"Footer Appearing","value":{"style":{"x":"0px","y":"41px"},"triggers":[{"type":"load","preload":true,"stepsA":[{"wait":1400},{"transition":"transform 500ms ease 0ms","x":"0px","y":"0px"}],"stepsB":[]}]}}
]);

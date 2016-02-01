/* eslint-disable */
// from https://github.com/facebook/react/issues/945, object bind polyfill for phantomjs
// https://gist.github.com/noradaiko/12cbaf8a1674e3b8c8e6
var Ap = Array.prototype;
var slice = Ap.slice;
var Fp = Function.prototype;

if (!Fp.bind) {
    // PhantomJS doesn't support Function.prototype.bind natively, so
    // polyfill it whenever this module is required.
    Fp.bind = function(context) {
      var func = this;
      var args = slice.call(arguments, 1);

      function bound() {
        var invokedAsConstructor = func.prototype && (this instanceof func);
        return func.apply(
          // Ignore the context parameter when invoking the bound function
          // as a constructor. Note that this includes not only constructor
          // invocations using the new keyword but also calls to base class
          // constructors such as BaseClass.call(this, ...) or super(...).
          !invokedAsConstructor && context || this,
          args.concat(slice.call(arguments))
        );
      }

      // The bound function must share the .prototype of the unbound
      // function so that any object created by one constructor will count
      // as an instance of both constructors.
      bound.prototype = func.prototype;

      return bound;
    };
}

// history API shim
var history = window.history;
var oldPushState = history.pushState.bind(history);
var oldReplaceState = history.replaceState.bind(history);

history.pushState = function(state, title, url) {
    history.state = state;
    return oldPushState(state, title, url);
};
history.replaceState = function(state, title, url) {
    history.state = state;
    return oldReplaceState(state, title, url);
};


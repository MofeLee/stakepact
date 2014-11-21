angular.module('app').directive("editInline", function($window){
  return function(scope, element, attr){
  // a method to update the width of an input
  // based on it's value.
    var updateWidth = function () {
      // create a dummy span, we'll use this to measure text.
      var tester = angular.element('<span>'),

      // get the computed style of the input
      elemStyle = $window.document.defaultView
      .getComputedStyle(element[0], '');

      var padding = attr.padding || 0;

      // apply any styling that affects the font to the tester span.
      tester.css({
        'font-family': elemStyle.fontFamily,
        'line-height': elemStyle.lineHeight,
        'font-size': elemStyle.fontSize,
        'font-weight': elemStyle.fontWeight,
        'letter-spacing': elemStyle.letterSpacing,
        'text-transform': elemStyle.textTransform
      });

      // update the text of the tester span
      tester.text(element.val());

      // put the tester next to the input temporarily.
      element.parent().append(tester);

      // measure!
      var r = tester[0].getBoundingClientRect();
      var w = r.width;

      // apply the new width!
      element.css('width', (w + padding) + 'px');

      // remove the tester.
      tester.remove();
    };

    // initalize the input
    updateWidth();

    // do it on keydown so it updates "real time"
    element.bind("keydown", function(){

      // set an immediate timeout, so the value in
      // the input has updated by the time this executes.
      $window.setTimeout(updateWidth, 0);
    });

  };
});
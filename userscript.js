// ==UserScript==
// @name         Webassign Improved
// @namespace    http://alexwendland.com
// @version      0.4
// @description  Improves the webassign.net experience. See demo at http://codepen.io/awendland/pen/GgqpLo
// @author       Alex Wendland
// @match        *://webassign.net/web/Student/Assignment-Responses*
// @match        *://www.webassign.net/web/Student/Assignment-Responses*
// @updateURL    https://rawgit.com/awendland/webassign-greasemonkey-applet/master/userscript.js
// @grant        none
// ==/UserScript==

// Setup utils
var head = document.querySelector('head');
var ROOT_FOLDER = "https://rawgit.com/awendland/webassign-greasemonkey-applet/master/"
function loadScript(url, callback) {
    // Adding the script tag to the head as suggested before
    var script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = url;
    // Then bind the event to the callback function.
    // There are several events for cross browser compatibility.
    script.onreadystatechange = callback;
    script.onload = callback;
    // Fire the loading
    head.appendChild(script);
}
function loadStyle(url, callback) {
    // Adding the script tag to the head as suggested before
    var style = document.createElement('link');
    style.rel = "stylesheet";
    style.type = 'text/css';
    style.href = url;
    // Fire the loading
    head.appendChild(style);
}

// Fix min-width issue
var container = document.querySelector(".middle");
container.style.minWidth = "0px";

// Add detachable progress portion
loadStyle(ROOT_FOLDER + "detach-progress.css");
var hasScrolled = false;
window.addEventListener('scroll', function (e) {
    hasScrolled = true;
});
var aqDetails = document.querySelector('.assignmentQuestionDetails');
var aqDetailsCont = document.querySelector('.assignmentData');
aqDetailsCont.style.height = aqDetailsCont.offsetHeight + "px";
var aqDetailsHeight = aqDetails.offsetTop + aqDetails.offsetHeight;
setInterval(function () {
    if (hasScrolled) {
        if (document.body.scrollTop > aqDetailsHeight) {
            aqDetails.classList.add('float');
        } else {
            aqDetails.classList.remove('float');
        }
    }
    hasScrolled = false;
}, 250);

// Calculator Applet
loadStyle(ROOT_FOLDER + "style.css");
var mathHelper = document.createElement("div");
mathHelper.classList.add("mathhelper");
mathHelper.innerHTML = '<pre class="output"></pre><input placeholder="=" spellcheck=false><a class="toggle"></a>';
document.body.appendChild(mathHelper);
var toggleButton = mathHelper.querySelector(".toggle");
var mathInput = mathHelper.querySelector("input");
var mathOutput = mathHelper.querySelector("pre");

function toggleOpen() {
  mathHelper.classList.toggle("open");
  if (!mathHelper.classList.contains("open")) {
    localStorage.setItem("calc-width", mathHelper.style.width);
    localStorage.setItem("calc-height", mathHelper.style.height);
    mathHelper.style.width = "";
    mathHelper.style.height = "";
  } else {
    console.log(localStorage.getItem("calc-width"));
    mathHelper.style.width = localStorage.getItem("calc-width");
    mathHelper.style.height = localStorage.getItem("calc-height");
    mathOutput.scrollTop = mathOutput.scrollHeight;
  }
}

toggleButton.addEventListener("click", toggleOpen);
document.addEventListener('keyup', function doc_keyUp(e) {
    if (e.ctrlKey && e.keyCode == 66) {
        toggleOpen();
        mathInput.focus();
    }
}, false);
mathHelper.addEventListener('mousedown', function (event) {
  if (!this.classList.contains('open') || Math.abs(this.offsetLeft - event.clientX) > 8 || Math.abs(this.offsetTop - event.clientY) > 8)
    return;
  event.preventDefault();
  var elem = this,
      ogHeight = this.clientHeight,
      ogWidth = this.clientWidth,
      startX = event.screenX,
      startY = event.screenY;
  
  function moveListener(event) {
    elem.style.width = ogWidth + (startX - event.screenX) + "px";
    elem.style.height = ogHeight + (startY - event.screenY) + "px";
    localStorage.setItem("calc-width", mathHelper.style.width);
    localStorage.setItem("calc-height", mathHelper.style.height);
  }
  mathHelper.classList.add("resize");
  // attach to document so mouse doesn't have to stay precisely on the 'handle'
  document.addEventListener('mousemove', moveListener);
  document.addEventListener('mouseup', function() {
   mathHelper.classList.remove("resize");
    document.removeEventListener('mousemove', moveListener);
  });
});

mathOutput.innerHTML = localStorage.getItem("calc-history");

var mathLoaded = function() {
  math.import({
    clear: function() {
      localStorage.setItem("calc-history", "")
      mathOutput.innerHTML = "";
      return "output cleared.";
    },
    hypot: function(num1, num2) {
      return Math.sqrt(num1*num1 + num2*num2)
    }
  });
  var calculator = math.parser();
  mathInput.addEventListener("keypress", function(event) {
    if (event.keyCode === 13/*enter*/) {
      var expression = mathInput.value;
      var result;
      if (expression.indexOf('wolf(') == 0) {
        var func = expression.substring(5, expression.length - 1);
        var url = "http://www.wolframalpha.com/input/?i=" + encodeURIComponent(func);
        
        window.open(url, '_blank');
        result = '<a target="_blank" href="' + url + '">' + func + '</a>';
      } else {
        try {
          result = calculator.eval(expression);
        } catch (e) {
          result = e;
        }
      }
      mathOutput.innerHTML += "<div class=\"calculation\"><span class=\"exp\">" + expression + "</span>" + "<span class=\"res\">" + result + "</span></div>";
      localStorage.setItem("calc-history", mathOutput.innerHTML);
      mathInput.value = "";
      mathOutput.scrollTop = mathOutput.scrollHeight;
    }
  });
}
loadScript("http://cdnjs.cloudflare.com/ajax/libs/mathjs/1.1.1/math.min.js", mathLoaded);
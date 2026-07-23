/* ===========================================================================
   Cesar Prado — Portfolio scripts
   Handles: scroll-reveal animations (with per-element delays), the hero
   parallax, the scroll progress bar, the nav background, and the hero
   graticule crosses.
   =========================================================================== */

(function () {
  "use strict";

  var prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  /* ------------------------------------------------------------------
     1. Hero graticule crosses (small "+" marks in the map backdrop)
  ------------------------------------------------------------------ */
  function buildCrosses() {
    var g = document.getElementById("crosses");
    if (!g) return;
    var svgNS = "http://www.w3.org/2000/svg";
    for (var x = 1; x <= 5; x++) {
      for (var y = 1; y <= 3; y++) {
        var group = document.createElementNS(svgNS, "g");
        group.setAttribute(
          "transform",
          "translate(" + x * 240 + "," + y * 200 + ")"
        );
        group.setAttribute("class", "cross");

        var h = document.createElementNS(svgNS, "line");
        h.setAttribute("x1", -7);
        h.setAttribute("y1", 0);
        h.setAttribute("x2", 7);
        h.setAttribute("y2", 0);

        var v = document.createElementNS(svgNS, "line");
        v.setAttribute("x1", 0);
        v.setAttribute("y1", -7);
        v.setAttribute("x2", 0);
        v.setAttribute("y2", 7);

        group.appendChild(h);
        group.appendChild(v);
        g.appendChild(group);
      }
    }
  }

  /* ------------------------------------------------------------------
     2. Scroll-reveal animations
        Any element with class "reveal" fades in when it enters the
        viewport. Optional data-delay="ms" staggers it. Variants:
        .reveal-left, .reveal-right, .reveal-scale (see styles.css).
  ------------------------------------------------------------------ */
  function initReveals() {
    var reveals = document.querySelectorAll(".reveal");

    if (prefersReducedMotion || !("IntersectionObserver" in window)) {
      reveals.forEach(function (el) {
        el.classList.add("is-visible");
      });
      return;
    }

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var el = entry.target;
          var delay = parseInt(el.getAttribute("data-delay") || "0", 10);
          setTimeout(function () {
            el.classList.add("is-visible");
          }, delay);
          observer.unobserve(el);
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );

    reveals.forEach(function (el) {
      observer.observe(el);
    });
  }

  /* ------------------------------------------------------------------
     3. Hero parallax
        The map backdrop drifts upward at a fraction of scroll speed,
        giving the hero gentle depth. Runs inside requestAnimationFrame
        so scrolling stays smooth.
  ------------------------------------------------------------------ */
  function initParallax() {
    if (prefersReducedMotion) return;
    var backdrop = document.getElementById("mappaper");
    if (!backdrop) return;

    var ticking = false;

    function update() {
      var y = window.scrollY;
      // Only bother while the hero is on screen
      if (y < window.innerHeight) {
        backdrop.style.transform = "translateY(" + y * 0.18 + "px)";
      }
      ticking = false;
    }

    window.addEventListener(
      "scroll",
      function () {
        if (!ticking) {
          window.requestAnimationFrame(update);
          ticking = true;
        }
      },
      { passive: true }
    );
  }

  /* ------------------------------------------------------------------
     4. Scroll progress bar
        The thin green line at the very top fills as you scroll the page.
  ------------------------------------------------------------------ */
  function initProgressBar() {
    if (prefersReducedMotion) return;
    var bar = document.getElementById("progressBar");
    if (!bar) return;

    var ticking = false;

    function update() {
      var doc = document.documentElement;
      var max = doc.scrollHeight - window.innerHeight;
      var ratio = max > 0 ? window.scrollY / max : 0;
      bar.style.transform = "scaleX(" + ratio + ")";
      ticking = false;
    }

    window.addEventListener(
      "scroll",
      function () {
        if (!ticking) {
          window.requestAnimationFrame(update);
          ticking = true;
        }
      },
      { passive: true }
    );
    update();
  }

  /* ------------------------------------------------------------------
     5. Nav background on scroll
  ------------------------------------------------------------------ */
  function initNav() {
    var nav = document.getElementById("siteNav");
    if (!nav) return;

    function onScroll() {
      nav.classList.toggle("nav-scrolled", window.scrollY > 32);
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  /* ------------------------------------------------------------------
     6. Preloader
        Counts the latitude up to Elgin's (42.0354° N), then slides the
        overlay away, adds body.is-loaded (which triggers the hero's
        masked headline reveal), and only then starts the scroll reveals
        so nothing fires behind the curtain.
  ------------------------------------------------------------------ */
  function runPreloader(onDone) {
    var overlay = document.getElementById("preloader");
    var coord = document.getElementById("preloaderCoord");

    if (!overlay || prefersReducedMotion) {
      if (overlay) overlay.remove();
      document.body.classList.remove("is-loading");
      document.body.classList.add("is-loaded");
      onDone();
      return;
    }

    document.body.classList.add("is-loading");

    var target = 42.0354;
    var duration = 900; // ms
    var start = null;

    function easeOut(t) {
      return 1 - Math.pow(1 - t, 3);
    }

    function tick(timestamp) {
      if (!start) start = timestamp;
      var progress = Math.min((timestamp - start) / duration, 1);
      var value = target * easeOut(progress);
      if (coord) coord.textContent = value.toFixed(4) + "\u00B0 N";

      if (progress < 1) {
        window.requestAnimationFrame(tick);
      } else {
        // Small pause on the finished number, then slide away
        setTimeout(function () {
          overlay.classList.add("is-done");
          document.body.classList.remove("is-loading");
          document.body.classList.add("is-loaded");
          onDone();
          setTimeout(function () {
            overlay.remove();
          }, 900);
        }, 250);
      }
    }

    window.requestAnimationFrame(tick);
  }

  /* ------------------------------------------------------------------
     7. Magnetic buttons
        Buttons lean a few pixels toward the cursor and spring back,
        a subtle "alive" feel on hover. Skipped on touch devices and
        for reduced-motion users.
  ------------------------------------------------------------------ */
  function initMagneticButtons() {
    if (prefersReducedMotion) return;
    if (window.matchMedia("(hover: none)").matches) return;

    var strength = 6; // max pixels of pull

    document.querySelectorAll(".btn").forEach(function (btn) {
      btn.addEventListener("mousemove", function (e) {
        var rect = btn.getBoundingClientRect();
        var relX = (e.clientX - rect.left) / rect.width - 0.5;
        var relY = (e.clientY - rect.top) / rect.height - 0.5;
        btn.style.transform =
          "translate(" + relX * strength + "px," + relY * strength + "px)";
      });
      btn.addEventListener("mouseleave", function () {
        btn.style.transform = "";
      });
    });
  }

  /* ------------------------------------------------------------------
     8. GSAP ScrollReveal — word-by-word blur + fade on scroll
        Splits text into individual words, then uses GSAP ScrollTrigger
        to animate each word's opacity, blur, and the container's
        rotation as the user scrolls. Same visual effect as the React
        Bits ScrollReveal component, built in vanilla JS.
  ------------------------------------------------------------------ */
  function initScrollReveal() {
    if (typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") return;
    gsap.registerPlugin(ScrollTrigger);

    var baseOpacity = 0.1;
    var baseRotation = 3;
    var blurStrength = 4;

    document.querySelectorAll(".scroll-reveal").forEach(function (el) {
      // Split text nodes into wrapped <span class="sr-word"> elements
      var walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null, false);
      var textNodes = [];
      while (walker.nextNode()) textNodes.push(walker.currentNode);

      textNodes.forEach(function (node) {
        var parts = node.textContent.split(/(\s+)/);
        var frag = document.createDocumentFragment();
        parts.forEach(function (part) {
          if (part.match(/^\s+$/)) {
            frag.appendChild(document.createTextNode(part));
          } else if (part.length > 0) {
            var span = document.createElement("span");
            span.className = "sr-word";
            span.textContent = part;
            frag.appendChild(span);
          }
        });
        node.parentNode.replaceChild(frag, node);
      });

      var words = el.querySelectorAll(".sr-word");
      if (!words.length) return;

      // Container rotation
      gsap.fromTo(
        el,
        { transformOrigin: "0% 50%", rotate: baseRotation },
        {
          ease: "none",
          rotate: 0,
          scrollTrigger: {
            trigger: el,
            start: "top bottom",
            end: "bottom bottom",
            scrub: true,
          },
        }
      );

      // Word opacity
      gsap.fromTo(
        words,
        { opacity: baseOpacity },
        {
          ease: "none",
          opacity: 1,
          stagger: 0.05,
          scrollTrigger: {
            trigger: el,
            start: "top bottom-=20%",
            end: "bottom bottom",
            scrub: true,
          },
        }
      );

      // Word blur
      if (!prefersReducedMotion) {
        gsap.fromTo(
          words,
          { filter: "blur(" + blurStrength + "px)" },
          {
            ease: "none",
            filter: "blur(0px)",
            stagger: 0.05,
            scrollTrigger: {
              trigger: el,
              start: "top bottom-=20%",
              end: "bottom bottom",
              scrub: true,
            },
          }
        );
      }
    });
  }

  /* ------------------------------------------------------------------
     Boot
  ------------------------------------------------------------------ */
  buildCrosses();
  initParallax();
  initProgressBar();
  initNav();
  initMagneticButtons();
  runPreloader(function () {
    initReveals();
    initScrollReveal();
  });
})();

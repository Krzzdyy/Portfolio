/* ==========================================================================
   crisdee.ipynb — motion
   Lenis + GSAP (ScrollTrigger, SplitText, ScrambleText, DrawSVG, CustomEase,
   ScrollTo). The page behaves like a notebook: each cell runs when it scrolls
   into view. Its prompt shows In [*]: while the code types itself, then takes
   the next execution number (in the order you reached it, like Jupyter), and
   only then does the output render.
   ========================================================================== */

(function () {
  'use strict';

  var root = document.documentElement;
  var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasGsap = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';
  var lenis = null;
  var BAR = 52;

  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  /* ------------------------------------------------------------ cells menu
     Below 980px the toolbar links are hidden; this button opens them as a
     small table of contents. Esc, a tap outside, or picking a cell closes it. */
  var menuBtn = document.querySelector('.bar-menu');
  var menu = document.getElementById('cells-menu');
  function setMenu(open) {
    if (!menu || !menuBtn || menu.hidden === !open) return;
    menu.hidden = !open;
    menuBtn.setAttribute('aria-expanded', String(open));
    if (open && window.gsap && !prefersReduced) {
      gsap.fromTo(menu, { clipPath: 'inset(0% 0% 100% 0%)', y: -6 }, { clipPath: 'inset(0% 0% 0% 0%)', y: 0, duration: 0.5, ease: 'expo.out' });
      gsap.fromTo(menu.querySelectorAll('.menu-list li, .menu-resume'), { opacity: 0, x: -10 }, { opacity: 1, x: 0, duration: 0.4, stagger: 0.04, delay: 0.08, ease: 'expo.out' });
    }
  }
  if (menu && menuBtn) {
    menuBtn.addEventListener('click', function () { setMenu(menu.hidden); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !menu.hidden) { setMenu(false); menuBtn.focus(); } });
    document.addEventListener('pointerdown', function (e) { if (!menu.hidden && !menu.contains(e.target) && !menuBtn.contains(e.target)) setMenu(false); });
    window.addEventListener('resize', function () { if (window.innerWidth >= 980) setMenu(false); });
  }

  /* --------------------------------------------------------- anchor links */
  document.addEventListener('click', function (e) {
    var link = e.target.closest('a[href^="#"]');
    if (!link) return;
    var id = link.getAttribute('href');
    if (id.length < 2) return;
    var target = document.querySelector(id);
    if (!target) return;
    e.preventDefault();
    setMenu(false);
    var isTop = id === '#top';
    if (lenis) lenis.scrollTo(isTop ? 0 : target, { offset: isTop ? 0 : -BAR, duration: 1.4 });
    else target.scrollIntoView({ behavior: prefersReduced ? 'auto' : 'smooth' });
    if (history.replaceState) history.replaceState(null, '', id);
  });

  /* ------------------------------------------------------------- the form
     Works with or without GSAP. Shift+Enter runs the cell, as in Jupyter. */
  var form = document.querySelector('.form');
  var statusEl = document.getElementById('form-status');
  var onFormRun = null; // set below when motion is on

  function showStatus(msg, isError) {
    if (!statusEl) return;
    statusEl.hidden = false;
    statusEl.classList.toggle('is-error', !!isError);
    statusEl.textContent = msg;
  }

  if (form) {
    form.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && e.shiftKey) { e.preventDefault(); form.requestSubmit ? form.requestSubmit() : form.submit(); }
    });
    form.addEventListener('submit', function (e) {
      var firstInvalid = null;
      form.querySelectorAll('[required]').forEach(function (field) {
        var bad = !field.value.trim() || (field.type === 'email' && !field.checkValidity());
        field.setAttribute('aria-invalid', String(bad));
        if (bad && !firstInvalid) firstInvalid = field;
      });
      if (firstInvalid) {
        e.preventDefault();
        firstInvalid.focus();
        showStatus('TypeError: contact.send() is missing a name, a valid email or a message.', true);
        return;
      }
      // Post to FormSubmit's AJAX endpoint so the page stays put. If the request
      // fails, fall back to the visitor's email app.
      e.preventDefault();
      if (form.classList.contains('is-sending')) return;
      var name = form.querySelector('#name').value.trim();
      var email = form.querySelector('#email').value.trim();
      var message = form.querySelector('#message').value.trim();
      var submit = form.querySelector('[type="submit"]');
      form.classList.add('is-sending');
      if (submit) submit.disabled = true;
      showStatus('In [*]: sending…');

      var data = new FormData(form);
      data.set('_replyto', email);
      data.set('_subject', 'Portfolio enquiry from ' + name);
      fetch(form.action.replace('formsubmit.co/', 'formsubmit.co/ajax/'), {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: data
      })
        .then(function (res) { return res.json().then(function (json) { return { ok: res.ok, json: json }; }); })
        .then(function (r) {
          if (!r.ok || String(r.json.success) !== 'true') throw new Error(r.json.message || 'send failed');
          form.reset();
          var msg = '✓ 200 OK — message sent. I’ll get back to you soon.';
          if (onFormRun) onFormRun(msg); else showStatus(msg);
        })
        .catch(function (err) {
          // FormSubmit explains its refusals (form not activated yet, page opened
          // as a file instead of from a server…); show that instead of a generic error.
          var why = err && err.message && err.message !== 'send failed' && !/fetch|network/i.test(err.message) ? err.message : 'couldn’t send.';
          showStatus('ConnectionError: ' + why + ' Opening your email app instead…', true);
          if (window.console) console.warn('[contact form]', err);
          var body = message + '\n\n— ' + name + ' (' + email + ')';
          window.setTimeout(function () {
            window.location.href = 'mailto:crisdeet@gmail.com?subject=' + encodeURIComponent('Portfolio enquiry from ' + name) + '&body=' + encodeURIComponent(body);
          }, 4000);
        })
        .then(function () {
          form.classList.remove('is-sending');
          if (submit) submit.disabled = false;
        });
    });
  }

  /* ==================================================================
     Without GSAP, or with reduced motion: a still, fully readable page.
     ================================================================== */
  var boot = document.querySelector('.boot');
  if (!hasGsap || prefersReduced) {
    if (boot) boot.remove();
    if (!hasGsap) root.classList.remove('js');
    return;
  }

  gsap.registerPlugin(ScrollTrigger, SplitText, ScrambleTextPlugin, DrawSVGPlugin, CustomEase, ScrollToPlugin);
  // A24's in-out curve for anything that wipes or masks; expo.out for things that land
  CustomEase.create('ink', '0.77,0,0.175,1');
  gsap.defaults({ duration: 0.8, ease: 'expo.out' });

  if (window.Lenis) {
    lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
    gsap.ticker.lagSmoothing(0);
    lenis.stop();
  }

  var bar = document.getElementById('bar');
  var kernelState = document.querySelector('.kernel-state');

  /* ------------------------------------------------------ kernel status */
  var running = 0;
  function busy(on) {
    running = Math.max(0, running + (on ? 1 : -1));
    var isBusy = running > 0;
    if (bar.classList.contains('is-busy') === isBusy) return;
    bar.classList.toggle('is-busy', isBusy);
    if (kernelState) gsap.to(kernelState, { duration: 0.4, scrambleText: { text: isBusy ? 'busy' : 'idle', chars: 'lowerCase', speed: 0.6 }, overwrite: true });
  }

  /* ------------------------------------------------------- number reels
     A digit becomes a 0–9 column; rolling = sliding the column. */
  function buildReel(el) {
    var digits = el.textContent.trim().split('');
    el.textContent = '';
    el.setAttribute('aria-label', digits.join(''));
    digits.forEach(function () {
      var col = document.createElement('span');
      col.className = 'reel-col';
      col.setAttribute('aria-hidden', 'true');
      for (var d = 0; d < 10; d++) { var s = document.createElement('span'); s.textContent = d; col.appendChild(s); }
      el.appendChild(col);
    });
    el._digits = digits.length;
  }
  function rollReel(el, value, opts) {
    var str = String(value);
    while (str.length < el._digits) str = '0' + str;
    el.setAttribute('aria-label', String(value));
    return gsap.to(el.querySelectorAll('.reel-col'), {
      yPercent: function (i) { return -Number(str[i]) * 10; },
      duration: (opts && opts.duration) || 1.1,
      ease: 'expo.inOut',
      stagger: 0.06,
      overwrite: true
    });
  }
  var reels = gsap.utils.toArray('[data-reel]');
  reels.forEach(function (el) { buildReel(el); gsap.set(el.querySelectorAll('.reel-col'), { yPercent: 0 }); });

  /* ------------------------------------------- split helpers (masked) */
  function lines(el) {
    return SplitText.create(el, { type: 'lines', mask: 'lines', linesClass: 'split-line' });
  }
  function revealLines(tl, el, at) {
    if (!el) return;
    var s = lines(el);
    gsap.set(s.lines, { yPercent: 105 });
    tl.to(s.lines, { yPercent: 0, duration: 1.05, ease: 'power4.inOut', stagger: { amount: 0.25 } }, at);
  }
  function drawNote(tl, note, at) {
    if (!note) return;
    var path = note.querySelector('path');
    gsap.set(note, { autoAlpha: 0, y: 8 });
    if (path) gsap.set(path, { drawSVG: '0%' });
    tl.to(note, { autoAlpha: 1, y: 0, duration: 0.6 }, at);
    if (path) tl.to(path, { drawSVG: '100%', duration: 0.7, ease: 'power2.inOut' }, '<0.1');
  }

  /* ----------------------------------------------- the per-cell outputs
     Each returns a paused timeline that plays once the cell has "run". */
  var outputs = {
    1: function (cell) {
      var tl = gsap.timeline({ paused: true });
      var chars = [];
      cell.querySelectorAll('[data-chars]').forEach(function (line) {
        var s = SplitText.create(line, { type: 'chars', charsClass: 'split-char' }); // .hero-line clips them
        chars = chars.concat(s.chars);
      });
      gsap.set(chars, { yPercent: 110 });
      tl.to(chars, { yPercent: 0, duration: 1.1, stagger: 0.035 }, 0);
      revealLines(tl, cell.querySelector('.hero-intro'), 0.45);
      var hl = cell.querySelector('.hl');
      if (hl) { gsap.set(hl, { '--hl-x': 0 }); tl.to(hl, { '--hl-x': 1, duration: 0.7, ease: 'ink' }, 1.15); }
      var ctas = cell.querySelectorAll('.hero-ctas .btn');
      gsap.set(ctas, { opacity: 0, y: 14 });
      tl.to(ctas, { opacity: 1, y: 0, stagger: 0.08 }, 0.9);

      // Fig. 1 prints top-down, then crop marks snap to the corners
      var frame = cell.querySelector('.fig-frame img');
      gsap.set(frame, { clipPath: 'inset(0 0 100% 0)', scale: 1.15 });
      tl.to(frame, { clipPath: 'inset(0 0 0% 0)', duration: 1.3, ease: 'ink' }, 0.2)
        .to(frame, { scale: 1, duration: 1.8 }, 0.2);
      var crops = cell.querySelectorAll('.crop');
      gsap.set(crops, { scale: 0 });
      tl.to(crops, { scale: 1, duration: 0.5, stagger: 0.06, ease: 'back.out(3)' }, 1.1);
      var cap = cell.querySelector('.fig-cap > span:first-child');
      var coord = cell.querySelector('.fig-coord');
      gsap.set([cap, coord], { autoAlpha: 0 });
      tl.to(cap, { autoAlpha: 1, duration: 0.4 }, 1.25)
        .to(coord, { autoAlpha: 1, duration: 0.01 }, 1.3)
        .to(coord, { duration: 1, scrambleText: { text: coord.textContent, chars: '0123456789.°', speed: 0.5 } }, 1.3);
      drawNote(tl, cell.querySelector('.note--fig'), 1.6);

      // describe(): rules draw from the left, values follow
      var rows = cell.querySelectorAll('.df-head, .df-row');
      gsap.set(rows, { '--rule-x': 0 });
      gsap.set(cell.querySelectorAll('.df-row > span, .df-head > span, .df-foot'), { autoAlpha: 0, x: -10 });
      tl.to(rows, { '--rule-x': 1, duration: 0.9, ease: 'ink', stagger: 0.08 }, 1.0)
        .to(cell.querySelectorAll('.df-head > span, .df-row > span, .df-foot'), { autoAlpha: 1, x: 0, duration: 0.6, stagger: 0.035 }, 1.2);
      return tl;
    },

    2: function (cell) {
      var tl = gsap.timeline({ paused: true });
      revealLines(tl, cell.querySelector('.degree-title'), 0);
      fadeSub(tl, cell, 0.3);
      gsap.set(cell.querySelectorAll('.chart-grid line'), { drawSVG: '0%' });
      tl.to(cell.querySelectorAll('.chart-grid line'), { drawSVG: '100%', duration: 1, ease: 'ink', stagger: 0.06 }, 0.2);
      var done = cell.querySelector('.chart-line:not(.chart-line--now):not(.chart-line--target)');
      var now = cell.querySelector('.chart-line--now');
      var target = cell.querySelector('.chart-line--target');
      gsap.set([done, now], { drawSVG: '0%' });
      gsap.set(target, { autoAlpha: 0 });
      // three finished years draw at an even pace; year 4 only gets part of the way
      tl.to(done, { drawSVG: '100%', duration: 1.5, ease: 'none' }, 0.6)
        .to(target, { autoAlpha: 1, duration: 0.4 }, 2.0)
        .to(now, { drawSVG: '100%', duration: 1.1, ease: 'power2.out' }, 2.1);
      var points = cell.querySelectorAll('.chart-points li');
      gsap.set(cell.querySelectorAll('.chart-points b'), { scale: 0 });
      gsap.set(cell.querySelectorAll('.chart-points span'), { autoAlpha: 0, y: -6 });
      points.forEach(function (li, i) {
        var at = i < 3 ? 0.6 + (i + 1) * 0.5 : 2.4;
        tl.to(li.querySelector('b'), { scale: 1, duration: 0.5, ease: 'back.out(2.5)' }, at)
          .to(li.querySelector('span'), { autoAlpha: 1, y: 0, duration: 0.4 }, at + 0.05);
      });
      var reel = cell.querySelector('[data-reel]');
      tl.add(function () { rollReel(reel, 3); }, 0.9);
      drawNote(tl, cell.querySelector('.note--chart'), 2.7);
      // one ambient loop: the unfinished year breathes
      tl.add(function () {
        gsap.to(cell.querySelector('.is-now b'), { scale: 1.18, duration: 0.9, ease: 'sine.inOut', repeat: -1, yoyo: true });
      });
      return tl;
    },

    3: function (cell) {
      var tl = gsap.timeline({ paused: true });
      revealLines(tl, cell.querySelector('.out-title'), 0);
      fadeSub(tl, cell, 0.3);
      return tl; // the groups below import themselves as they scroll in (setupToolkit)
    },

    4: function (cell) {
      var tl = gsap.timeline({ paused: true });
      revealLines(tl, cell.querySelector('.out-title'), 0);
      fadeSub(tl, cell, 0.3);
      // opacity, not autoAlpha: anything that holds a link must stay focusable before its cell runs
      var stack = cell.querySelector('.files');
      gsap.set(stack, { opacity: 0, y: 40 });
      tl.to(stack, { opacity: 1, y: 0, duration: 1 }, 0.25);
      return tl;
    },

    5: function (cell) {
      var tl = gsap.timeline({ paused: true });
      revealLines(tl, cell.querySelector('.out-title'), 0);
      fadeSub(tl, cell, 0.3);
      var bits = cell.querySelectorAll('.form-line, .arg, .form-actions');
      gsap.set(bits, { opacity: 0, x: -12 });
      tl.to(bits, { opacity: 1, x: 0, stagger: 0.07, duration: 0.6 }, 0.35);
      var note = cell.querySelector('.note--contact');
      if (note) { gsap.set(note, { autoAlpha: 0, scale: 0.8 }); tl.to(note, { autoAlpha: 1, scale: 1, duration: 0.6, ease: 'back.out(2)' }, 1); }
      return tl;
    }
  };
  function fadeSub(tl, cell, at) {
    var sub = cell.querySelector('.out-sub');
    if (!sub) return;
    gsap.set(sub, { autoAlpha: 0, y: 12 });
    tl.to(sub, { autoAlpha: 1, y: 0 }, at);
  }

  /* --------------------------------------------- running a cell
     In [ ]: → In [*]: and the code types → In [n]: → exec time → output */
  var execCount = 0;
  var cells = gsap.utils.toArray('.cell');

  function buildCells() {
  cells.forEach(function (cell) {
    var count = cell.querySelector('[data-count]');
    var code = cell.querySelector('[data-type]');
    var exec = cell.querySelector('.exec');
    if (count) count.textContent = ' ';
    if (exec) gsap.set(exec, { autoAlpha: 0 });
    var codeChars = null;
    if (code) {
      codeChars = SplitText.create(code, { type: 'words,chars', wordsClass: 'code-word', charsClass: 'code-char' }).chars;
      gsap.set(codeChars, { autoAlpha: 0 });
    }
    var build = outputs[cell.getAttribute('data-cell')];
    cell._out = build ? build(cell) : null;
    cell._run = function () {
      if (cell._ran) return;
      cell._ran = true;
      var t0 = performance.now();
      busy(true);
      if (count) count.textContent = '*';
      var tl = gsap.timeline({
        onComplete: function () {
          execCount++;
          if (count) count.textContent = execCount;
          if (exec) {
            exec.textContent = '✓ ' + ((performance.now() - t0) / 1000).toFixed(1) + 's';
            gsap.fromTo(exec, { autoAlpha: 0, x: 6 }, { autoAlpha: 1, x: 0, duration: 0.5 });
          }
          busy(false);
          if (cell._out) cell._out.play();
        }
      });
      // typing: one character every 28ms, no easing, like a fast typist, with a caret riding along
      if (codeChars) {
        var caret = document.createElement('span');
        caret.className = 'caret';
        caret.setAttribute('aria-hidden', 'true');
        code.appendChild(caret);
        var blink = gsap.to(caret, { opacity: 0, duration: 0.45, ease: 'steps(1)', repeat: -1, yoyo: true, paused: true });
        tl.to(codeChars, { autoAlpha: 1, duration: 0.01, stagger: 0.028, ease: 'none' })
          .add(function () { blink.play(); })
          .to({}, { duration: 0.25 }) // the kernel "thinks"
          .add(function () { blink.kill(); caret.remove(); });
      } else {
        tl.to({}, { duration: 0.25 });
      }
    };
    // keyboard users can tab into a cell before scrolling to it: run it then
    cell.addEventListener('focusin', function () { cell._run(); });
  });
  }

  /* ------------------------------------------------------- boot sequence */
  function start() {
    // Cells run when they come into view; created top-to-bottom so refresh order matches the page
    cells.forEach(function (cell) {
      ScrollTrigger.create({ trigger: cell, start: 'top 72%', once: true, onEnter: cell._run });
      ScrollTrigger.create({ trigger: cell, start: 'top 50%', end: 'bottom 50%', toggleClass: { targets: cell, className: 'is-active' } });
    });
    setupToolkit();
    setupProjects();
    setupNav();
    setupMotionExtras();
    // the folder pin is created after the cell triggers below it: put them back in page order
    ScrollTrigger.sort();
    ScrollTrigger.refresh();
  }

  // Line splits depend on the webfonts, so cells are built once fonts are in
  // (or after 2.5s, whichever comes first). The boot screen covers the wait.
  var fontsReady = new Promise(function (resolve) {
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(resolve);
    else resolve();
    window.setTimeout(resolve, 2500);
  });

  function openNotebook() {
    var tl = gsap.timeline({
      onComplete: function () {
        if (boot) boot.remove();
        if (lenis) lenis.start();
        start();
      }
    });
    if (boot) {
      tl.to(boot.querySelector('.boot-text'), { duration: 0.6, scrambleText: { text: 'Kernel ready · Python 3', chars: 'lowerCase', speed: 0.6 } })
        .to(boot.querySelector('.boot-dot'), { backgroundColor: '#1f3fd1', borderColor: '#1f3fd1', duration: 0.2 }, '<0.4')
        .to(boot, { clipPath: 'inset(0% 0% 100% 0%)', duration: 0.9, ease: 'ink' }, '+=0.2');
    }
    tl.from(bar, { yPercent: -100, duration: 0.8 }, boot ? '<0.3' : 0);
  }

  if (boot) gsap.from(boot.querySelector('.boot-line'), { autoAlpha: 0, y: 8, duration: 0.5 });
  Promise.all([fontsReady, new Promise(function (r) { window.setTimeout(r, 600); })]).then(function () {
    buildCells();
    openNotebook();
  });

  /* ------------------------------------------------ toolbar progress bar */
  gsap.to('.bar-progress span', { scaleX: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: 0.3 } });

  /* ---------------------------------------------- nav: active section */
  function setupNav() {
    gsap.utils.toArray('[data-nav]').forEach(function (link) {
      var target = document.querySelector(link.getAttribute('href'));
      if (!target) return;
      ScrollTrigger.create({
        trigger: target, start: 'top 50%', end: 'bottom 50%',
        toggleClass: { targets: link, className: 'is-active' }
      });
    });
  }

  /* ------------------------------------------------ In [3]: the toolkit
     Each group runs like its own little cell as it scrolls in: the import
     line types (with a caret), then the tiles print top-down. Brand logos
     draw their outline and then ink in; line icons just draw. Concepts get
     their call scrambled in and their rule drawn. */
  function typeLine(tl, code) {
    var chars = SplitText.create(code, { type: 'words,chars', wordsClass: 'code-word', charsClass: 'code-char' }).chars; // words keep wraps between words
    gsap.set(chars, { autoAlpha: 0 });
    var caret = document.createElement('span');
    caret.className = 'caret';
    caret.setAttribute('aria-hidden', 'true');
    tl.add(function () { code.appendChild(caret); })
      .to(chars, { autoAlpha: 1, duration: 0.01, stagger: 0.022, ease: 'none' })
      .add(function () { caret.remove(); }, '+=0.15');
  }

  function setupToolkit() {
    gsap.utils.toArray('.stack-group').forEach(function (group) {
      var tl = gsap.timeline({ paused: true });
      var code = group.querySelector('[data-import]');
      if (code) typeLine(tl, code);
      var at = '-=0.05';

      var tiles = group.querySelectorAll('.tile');
      if (tiles.length) {
        gsap.set(tiles, { opacity: 0, y: 26, clipPath: 'inset(0% 0% 100% 0%)' });
        tl.addLabel('tiles', at)
          .to(tiles, { opacity: 1, y: 0, clipPath: 'inset(0% 0% 0% 0%)', duration: 0.9, ease: 'ink', stagger: 0.07, clearProps: 'clipPath' }, 'tiles');
        tiles.forEach(function (tile, i) {
          var t = 'tiles+=' + (0.3 + i * 0.07).toFixed(2); // each logo starts as its tile opens
          var brandPath = tile.querySelector('.tile-logo--brand path');
          var lines = tile.querySelectorAll('.tile-logo--line > *');
          if (brandPath) {
            // outline first, then the ink floods in and the outline goes
            gsap.set(brandPath, { drawSVG: '0%', strokeWidth: 0.35, fillOpacity: 0 });
            tl.to(brandPath, { drawSVG: '100%', duration: 1.1, ease: 'power2.inOut' }, t)
              .to(brandPath, { fillOpacity: 1, duration: 0.5, ease: 'power1.out' }, '>-0.25')
              .to(brandPath, { strokeWidth: 0, duration: 0.3 }, '<0.2');
          } else if (lines.length) {
            gsap.set(lines, { drawSVG: '0%' });
            tl.to(lines, { drawSVG: '100%', duration: 0.9, ease: 'power2.inOut', stagger: 0.08 }, t);
          }
          var idx = tile.querySelector('.tile-idx');
          if (idx) tl.to(idx, { duration: 0.5, scrambleText: { text: idx.textContent, chars: '0123456789', speed: 0.6 } }, t);
        });
      }

      var methods = group.querySelectorAll('.method');
      if (methods.length) {
        gsap.set(methods, { '--rule-x': 0 });
        gsap.set(group.querySelectorAll('.method-name'), { opacity: 0, x: 12 });
        tl.addLabel('methods', at)
          .to(methods, { '--rule-x': 1, duration: 0.9, ease: 'ink', stagger: 0.07 }, 'methods');
        methods.forEach(function (m, i) {
          var call = m.querySelector('.method-call');
          var t = 'methods+=' + (0.1 + i * 0.07).toFixed(2);
          tl.to(call, { duration: 0.7, scrambleText: { text: call.textContent, chars: '()._abcdefghijklmnopqrstuvwxyz', speed: 0.7 } }, t)
            .to(m.querySelector('.method-name'), { opacity: 1, x: 0, duration: 0.6 }, 'methods+=' + (0.25 + i * 0.07).toFixed(2));
        });
      }

      ScrollTrigger.create({
        trigger: group, start: 'top 82%', once: true,
        onEnter: function () { busy(true); tl.eventCallback('onComplete', function () { busy(false); }); tl.play(); }
      });
    });
  }

  /* ---------------------------------------------- In [4]: the folder stack
     The cell pins; each folder swipes up over the one before it, which sinks
     back and dims; each rests in view for a beat. Gated on height so a folder
     always fits. The iloc[n] reel in the hint follows the folder on top. */
  function setupProjects() {
    var section = document.querySelector('.cell--projects');
    var files = gsap.utils.toArray('.file');
    var reel = section && section.querySelector('.files-hint [data-reel]');
    if (!section || files.length < 2) return;
    var active = -1;

    function setActive(i) {
      if (i === active) return;
      active = i;
      files.forEach(function (f, k) { f.classList.toggle('is-active', k === i); });
      if (reel && i >= 0) rollReel(reel, i, { duration: 0.7 });
    }

    var mm = gsap.matchMedia();
    mm.add('(min-height: 560px)', function () {
      section.classList.add('is-stacked');
      setActive(0);
      var steps = files.length - 1;
      var tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: function () { return '+=' + Math.round(window.innerHeight * 1.1 * steps); },
          pin: true,
          scrub: 0.8,
          invalidateOnRefresh: true,
          onUpdate: function (self) { setActive(Math.round(self.progress * steps)); }
          // No ScrollTrigger snap: it fights Lenis. The timeline has rest
          // stretches (HOLD) where each folder sits still instead.
        }
      });

      var HOLD = 0.45;
      tl.to({}, { duration: HOLD / 2 }, 0);
      files.slice(1).forEach(function (file, n) {
        var prev = files[n];
        var at = HOLD / 2 + n * (1 + HOLD);
        // the incoming folder swipes up with a little tilt, then its screenshot settles under the clip
        tl.fromTo(file, { y: function () { return window.innerHeight; }, rotation: 4 }, { y: 0, rotation: 0, duration: 1, ease: 'power2.out' }, at);
        var shot = file.querySelector('.file-shot');
        if (shot) tl.fromTo(shot, { rotation: -8, y: 28 }, { rotation: -1.2, y: 0, duration: 0.8, ease: 'back.out(1.6)' }, at + 0.2);
        var copy = file.querySelectorAll('.file-copy > *, .file-sheet--nan > *');
        if (copy.length) tl.fromTo(copy, { y: 18, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, stagger: 0.06, ease: 'power2.out' }, at + 0.35);
        // the outgoing folder (tab and body together, so they never come apart) sinks back and dims
        tl.to(prev, { scale: 0.965, transformOrigin: '50% 0%', duration: 1 }, at);
        var shade = prev.querySelector('.file-shade');
        if (shade) tl.to(shade, { opacity: 0.2, duration: 1 }, at);
      });
      tl.to({}, { duration: HOLD / 2 });

      return function () {
        section.classList.remove('is-stacked');
        setActive(-1);
        active = -1;
      };
    });

    // Too short to stack: the folders stay a list and slide in one by one
    mm.add('(max-height: 559px)', function () {
      files.forEach(function (f, i) {
        gsap.from(f, {
          y: 60, rotation: i % 2 ? 2 : -2, opacity: 0, duration: 0.9,
          scrollTrigger: { trigger: f, start: 'top 88%' }
        });
      });
    });
  }

  /* ================================================= small interactions
     All pointer-only, and all quiet: each one belongs to something on the page. */
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  // Graph paper drifts up at a fifth of the scroll speed, wrapping every major square
  var paper = document.querySelector('.paper');
  if (paper) {
    var setPaper = gsap.quickSetter(paper, 'y', 'px');
    ScrollTrigger.create({ start: 0, end: 'max', onUpdate: function (self) { setPaper(-((self.scroll() * 0.2) % 120)); } });
  }

  function setupMotionExtras() {
    // Notebook outline follows the active cell
    gsap.utils.toArray('.outline a').forEach(function (link) {
      var target = document.querySelector(link.getAttribute('href'));
      if (target) ScrollTrigger.create({ trigger: target, start: 'top 50%', end: 'bottom 50%', toggleClass: { targets: link, className: 'is-active' } });
    });

    // Leaving the first screen: the two name lines part, the figure drifts up
    var heroCell = document.querySelector('.cell--hero');
    gsap.to('.hero-line', {
      xPercent: function (i) { return i ? 9 : -6; }, ease: 'none',
      scrollTrigger: { trigger: heroCell, start: 'top top', end: 'bottom top', scrub: true }
    });
    gsap.to('.fig', { yPercent: -12, ease: 'none', scrollTrigger: { trigger: heroCell, start: 'top top', end: 'bottom top', scrub: true } });

    if (!finePointer) return;

    // Fig. 1 tilts toward the cursor; the crop marks spread a little on hover
    var fig = document.querySelector('.fig');
    var frame = fig && fig.querySelector('.fig-frame');
    if (fig && frame) {
      var rx = gsap.quickTo(frame, 'rotationX', { duration: 0.6, ease: 'power3.out' });
      var ry = gsap.quickTo(frame, 'rotationY', { duration: 0.6, ease: 'power3.out' });
      var crops = fig.querySelectorAll('.crop');
      var out = [[-1, -1], [1, -1], [-1, 1], [1, 1]];
      fig.addEventListener('pointermove', function (e) {
        var r = fig.getBoundingClientRect();
        ry(((e.clientX - r.left) / r.width - 0.5) * 10);
        rx(-((e.clientY - r.top) / r.height - 0.5) * 10);
      });
      fig.addEventListener('pointerenter', function () {
        gsap.to(crops, { x: function (i) { return out[i][0] * 7; }, y: function (i) { return out[i][1] * 7; }, duration: 0.5, overwrite: 'auto' });
      });
      fig.addEventListener('pointerleave', function () {
        rx(0); ry(0);
        gsap.to(crops, { x: 0, y: 0, duration: 0.6, overwrite: 'auto' });
      });
    }

    // Toolkit tiles tilt toward the cursor; the logo leans out a little
    gsap.utils.toArray('.tile').forEach(function (tile) {
      gsap.set(tile, { transformPerspective: 700 });
      var logo = tile.querySelector('.tile-logo');
      var tx = gsap.quickTo(tile, 'rotationY', { duration: 0.5, ease: 'power3.out' });
      var ty = gsap.quickTo(tile, 'rotationX', { duration: 0.5, ease: 'power3.out' });
      var lx = gsap.quickTo(logo, 'x', { duration: 0.5, ease: 'power3.out' });
      var ly = gsap.quickTo(logo, 'y', { duration: 0.5, ease: 'power3.out' });
      tile.addEventListener('pointermove', function (e) {
        var r = tile.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5, py = (e.clientY - r.top) / r.height - 0.5;
        tx(px * 14); ty(-py * 14); lx(px * 8); ly(py * 8);
      });
      tile.addEventListener('pointerenter', function () { gsap.to(logo, { scale: 1.12, duration: 0.4, ease: 'back.out(2.5)', overwrite: 'auto' }); });
      tile.addEventListener('pointerleave', function () {
        tx(0); ty(0); lx(0); ly(0);
        gsap.to(logo, { scale: 1, duration: 0.5, overwrite: 'auto' });
      });
    });

    // Buttons lean toward the cursor
    gsap.utils.toArray('.btn').forEach(function (btn) {
      var bx = gsap.quickTo(btn, 'x', { duration: 0.4, ease: 'power3.out' });
      var by = gsap.quickTo(btn, 'y', { duration: 0.4, ease: 'power3.out' });
      btn.addEventListener('pointermove', function (e) {
        var r = btn.getBoundingClientRect();
        bx((e.clientX - r.left - r.width / 2) * 0.22);
        by((e.clientY - r.top - r.height / 2) * 0.3);
      });
      btn.addEventListener('pointerleave', function () {
        gsap.to(btn, { x: 0, y: 0, duration: 0.8, ease: 'elastic.out(1, 0.4)', overwrite: true });
      });
    });

    // Mono links re-print themselves on hover
    gsap.utils.toArray('.bar-nav a, .foot-links a, .file-link').forEach(function (a) {
      var text = a.textContent;
      a.addEventListener('pointerenter', function () {
        gsap.to(a, { duration: 0.5, scrambleText: { text: text, chars: 'lowerCase', speed: 0.8 }, overwrite: true });
      });
    });

    // Chart points pop when you point at them
    gsap.utils.toArray('.chart-points li').forEach(function (li) {
      var dot = li.querySelector('b');
      li.addEventListener('pointerenter', function () { gsap.to(dot, { scale: 1.35, duration: 0.4, ease: 'back.out(3)', overwrite: 'auto' }); });
      li.addEventListener('pointerleave', function () { gsap.to(dot, { scale: 1, duration: 0.4, overwrite: 'auto' }); });
    });
  }

  /* ---------------------------------------------- re-running In [5] */
  onFormRun = function (msg) {
    var cell = document.getElementById('contact');
    var count = cell.querySelector('[data-count]');
    busy(true);
    if (count) count.textContent = '*';
    showStatus('');
    gsap.to(statusEl, {
      duration: 0.9, delay: 0.2,
      scrambleText: { text: msg, chars: 'upperCase', speed: 0.6 },
      onComplete: function () { execCount++; if (count) count.textContent = execCount; busy(false); }
    });
  };

})();

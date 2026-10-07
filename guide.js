(function () {
  'use strict';

  var guide = document.getElementById('portfolio-guide');
  if (!guide) return;

  var popover = document.getElementById('guide-popover');
  var character = document.getElementById('guide-character');
  var guideArt = character.querySelector('.guide-art');
  var pupils = character.querySelector('.guide-pupils');
  var speech = document.getElementById('guide-speech');
  var stepLabel = document.getElementById('guide-step');
  var inviteActions = document.getElementById('guide-invite-actions');
  var tourActions = document.getElementById('guide-tour-actions');
  var startButton = document.getElementById('guide-start');
  var laterButton = document.getElementById('guide-later');
  var pauseButton = document.getElementById('guide-pause');
  var nextButton = document.getElementById('guide-next');
  var menuToggle = document.getElementById('guide-menu-toggle');
  var guideMenu = document.getElementById('guide-menu');
  var replayButton = document.getElementById('guide-replay');
  var endButton = document.getElementById('guide-end');
  var dismissButton = document.getElementById('guide-dismiss');
  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var isTouring = false;
  var isPopoverOpen = false;
  var isPaused = false;
  var isAtStop = false;
  var currentStep = 0;
  var travelToken = 0;
  var activeLine = '';
  var autoTimer = null;
  var introTimer = null;
  var isStarting = false;
  var moveAnimation = null;
  var walkTimer = null;
  var speechTimer = null;
  var mouthTimer = null;
  var focusedTarget = null;
  var steps = [
    { name: 'ABOUT', tab: 0, target: '.tab-content[data-tab-name="about"] .heading-xl', line: 'I build the reliable bits behind useful products.' },
    { name: 'PROJECTS', tab: 2, target: '.tab-content[data-tab-name="projects"] .project-card', line: 'Real systems, each with its own knot to untangle.' },
    { name: 'SERVICES', tab: 1, target: '.tab-content[data-tab-name="services"] .tab-panel-inner > div:nth-child(2) > div:first-child', line: 'From a focused API to a full product build, here’s how I help.' },
    { name: 'EXPERIENCE', tab: 3, target: '.tab-content[data-tab-name="experience"] .timeline-container', line: 'A few years of features, fixes, and production lessons.' },
    { name: 'CONTACT', tab: 4, target: '#contact-form', line: 'Have a system that needs untangling? Your turn.' }
  ];

  function setPopoverOpen(open) {
    isPopoverOpen = open;
    popover.setAttribute('aria-hidden', open ? 'false' : 'true');
    character.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (open) guide.setAttribute('data-open', 'true');
    else guide.removeAttribute('data-open');
  }

  function setSpeech(line) {
    window.clearTimeout(speechTimer);
    speech.classList.remove('is-changing');
    speech.textContent = line;
    speechTimer = window.setTimeout(function () { speech.classList.add('is-changing'); }, 20);
    window.clearTimeout(mouthTimer);
    guideArt.classList.remove('is-speaking');
    void guideArt.offsetWidth;
    guideArt.classList.add('is-speaking');
    mouthTimer = window.setTimeout(function () { guideArt.classList.remove('is-speaking'); }, 800);
  }

  function delay(ms) {
    return new Promise(function (resolve) { window.setTimeout(resolve, ms); });
  }

  function settleTarget(target, token) {
    if (reducedMotion) return Promise.resolve();
    return new Promise(function (resolve) {
      var lastTop = NaN;
      var steadyFrames = 0;
      var started = performance.now();
      function check(now) {
        if (!isTouring || token !== travelToken || now - started > 1700) { resolve(); return; }
        var top = target.getBoundingClientRect().top;
        if (Math.abs(top - lastTop) < .5) steadyFrames++;
        else steadyFrames = 0;
        lastTop = top;
        if (steadyFrames >= 8) resolve();
        else requestAnimationFrame(check);
      }
      requestAnimationFrame(check);
    });
  }

  function wave() {
    if (reducedMotion) return;
    character.classList.remove('is-waving');
    void character.offsetWidth;
    character.classList.add('is-waving');
    window.setTimeout(function () { character.classList.remove('is-waving'); }, 1350);
  }

  function removeFocus() {
    if (focusedTarget) focusedTarget.classList.remove('guide-tour-target');
    focusedTarget = null;
  }

  function setFocus(target) {
    removeFocus();
    if (target) {
      target.classList.add('guide-tour-target');
      focusedTarget = target;
    }
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(value, max));
  }

  function glanceAt(targetRect) {
    if (!pupils || !targetRect) return;
    var rect = character.getBoundingClientRect();
    var originX = rect.left + rect.width * .5;
    var originY = rect.top + 48;
    var dx = targetRect.left + targetRect.width * .5 - originX;
    var dy = targetRect.top + targetRect.height * .5 - originY;
    pupils.style.setProperty('--gaze-x', clamp(dx / 140, -1.4, 1.4).toFixed(2) + 'px');
    pupils.style.setProperty('--gaze-y', clamp(dy / 150, -1, 1).toFixed(2) + 'px');
  }

  function setBubblePosition(x, y, targetRect) {
    var box = popover.getBoundingClientRect();
    var width = box.width || 306;
    var height = box.height || 150;
    var bubbleX = clamp(x - width - 16, 10, window.innerWidth - width - 10);
    // On narrow screens, put the bubble to the right of the character when it fits.
    if (window.innerWidth < 560 && bubbleX < 12) {
      bubbleX = clamp(x + 90, 10, window.innerWidth - width - 10);
    }
    var preferredY = targetRect ? targetRect.top + targetRect.height * .5 - height * .5 : y - height - 18;
    var topLimit = 76;
    var bottomLimit = window.innerHeight - height - (window.innerWidth < 1024 ? 100 : 16);
    var bubbleY = clamp(preferredY, topLimit, Math.max(topLimit, bottomLimit));
    guide.style.setProperty('--bubble-x', Math.round(bubbleX) + 'px');
    guide.style.setProperty('--bubble-y', Math.round(bubbleY) + 'px');
  }

  function enterTourMode() {
    if (guide.classList.contains('is-tour-mode')) return;
    var rect = character.getBoundingClientRect();
    guide.style.setProperty('--guide-x', Math.round(rect.left) + 'px');
    guide.style.setProperty('--guide-y', Math.round(rect.top) + 'px');
    guide.classList.add('is-tour-mode');
    setBubblePosition(rect.left, rect.top, null);
  }

  function walkTo(target, token) {
    var targetRect = target.getBoundingClientRect();
    var narrow = window.innerWidth < 1024;
    var charWidth = narrow ? 106 : 124;
    var charHeight = narrow ? 143 : 166;
    var safeBottom = narrow ? 102 : 18;
    var rightX = targetRect.right + 15;
    var leftX = targetRect.left - charWidth - 15;
    var x = rightX + charWidth <= window.innerWidth - 12 ? rightX :
      (leftX >= 12 ? leftX : window.innerWidth - charWidth - 12);
    var y = clamp(targetRect.top + targetRect.height * .5 - charHeight * .48, 88,
      window.innerHeight - charHeight - safeBottom);
    x = clamp(x, 12, window.innerWidth - charWidth - 12);
    glanceAt(targetRect);
    setBubblePosition(x, y, targetRect);

    character.classList.add('is-preparing');
    return delay(reducedMotion ? 0 : 180).then(async function () {
      character.classList.remove('is-preparing');
      if (!isTouring || token !== travelToken) return false;
      var from = guide.getBoundingClientRect();
      if (moveAnimation) {
        guide.style.setProperty('--guide-x', Math.round(from.left) + 'px');
        guide.style.setProperty('--guide-y', Math.round(from.top) + 'px');
        moveAnimation.cancel();
        moveAnimation = null;
      }
      var dx = x - from.left;
      var dy = y - from.top;
      if (Math.abs(dx) < 2 && Math.abs(dy) < 2 || reducedMotion) {
        guide.style.setProperty('--guide-x', Math.round(x) + 'px');
        guide.style.setProperty('--guide-y', Math.round(y) + 'px');
        return true;
      }

      var walkGroup = character.querySelector('.guide-walk');
      var targetIsLeft = targetRect.left + targetRect.width * .5 < x + charWidth * .5;
      if (walkGroup) walkGroup.setAttribute('transform', targetIsLeft ? 'translate(144 0) scale(-1 1)' : '');
      character.classList.add('is-turning');
      await delay(220);
      character.classList.remove('is-turning');
      if (!isTouring || token !== travelToken) return false;

      character.classList.add('is-walking');
      moveAnimation = guide.animate([
        { transform: 'translate3d(0, 0, 0)' },
        { transform: 'translate3d(' + dx + 'px, ' + dy + 'px, 0)' }
      ], { duration: clamp(Math.hypot(dx, dy) * .8, 850, 1500), easing: 'cubic-bezier(.22,.68,.12,1)', fill: 'forwards' });
      if (isPaused) moveAnimation.pause();

      return moveAnimation.finished.then(function () {
        if (token !== travelToken) return false;
        guide.style.setProperty('--guide-x', Math.round(x) + 'px');
        guide.style.setProperty('--guide-y', Math.round(y) + 'px');
        moveAnimation.cancel();
        moveAnimation = null;
        character.classList.remove('is-walking');
        character.classList.add('is-settling');
        window.setTimeout(function () { character.classList.remove('is-settling'); }, 420);
        return true;
      }).catch(function () { return false; });
    });
  }

  function scheduleNext() {
    window.clearTimeout(autoTimer);
    if (!isTouring || isPaused || !isAtStop) return;
    autoTimer = window.setTimeout(function () {
      if (currentStep >= steps.length - 1) finishTour();
      else goToStep(currentStep + 1);
    }, 3900);
  }

  async function goToStep(index) {
    if (!isTouring) return;
    window.clearTimeout(introTimer);
    introTimer = null;
    isStarting = false;
    if (isPaused) {
      isPaused = false;
      pauseButton.textContent = 'Pause';
      if (moveAnimation) moveAnimation.play();
    }
    var step = Math.max(0, Math.min(index, steps.length - 1));
    currentStep = step;
    var token = ++travelToken;
    isAtStop = false;
    window.clearTimeout(autoTimer);
    removeFocus();
    activeLine = steps[step].line;
    stepLabel.hidden = false;
    stepLabel.textContent = String(step + 1).padStart(2, '0') + ' / ' + String(steps.length).padStart(2, '0') + '  ·  ' + steps[step].name;
    guideMenu.hidden = true;
    menuToggle.setAttribute('aria-expanded', 'false');
    nextButton.innerHTML = step === steps.length - 1 ? 'Finish <span aria-hidden="true">✓</span>' : 'Skip stop <span aria-hidden="true">→</span>';
    setSpeech(activeLine);
    enterTourMode();
    setPopoverOpen(true);

    if (typeof window.openTabByIndex === 'function') window.openTabByIndex(steps[step].tab);
    await delay(410);
    if (!isTouring || token !== travelToken) return;

    var target = document.querySelector(steps[step].target);
    if (!target) {
      // A missing optional section should not strand the guide.
      if (step < steps.length - 1) goToStep(step + 1);
      else finishTour();
      return;
    }
    target.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'center', inline: 'nearest' });
    await settleTarget(target, token);
    if (!isTouring || token !== travelToken) return;

    var arrived = await walkTo(target, token);
    if (!arrived || !isTouring || token !== travelToken) return;
    setFocus(target);
    isAtStop = true;
    scheduleNext();
  }

  function beginTour() {
    isTouring = true;
    isPaused = false;
    isAtStop = false;
    currentStep = 0;
    pauseButton.textContent = 'Pause';
    character.setAttribute('aria-label', 'Pause Borhan’s portfolio tour');
    inviteActions.hidden = true;
    tourActions.hidden = false;
    enterTourMode();
    setPopoverOpen(true);
    activeLine = 'Welcome to my portfolio. I’ll show you around, one stop at a time.';
    setSpeech(activeLine);
    wave();
    window.clearTimeout(autoTimer);
    isStarting = true;
    introTimer = window.setTimeout(function () {
      introTimer = null;
      isStarting = false;
      if (isTouring && !isPaused) goToStep(0);
    }, 1450);
  }

  function pauseTour() {
    if (!isTouring) return;
    isPaused = !isPaused;
    if (isPaused) {
      window.clearTimeout(autoTimer);
      if (introTimer) { window.clearTimeout(introTimer); introTimer = null; }
      if (moveAnimation) moveAnimation.pause();
      pauseButton.textContent = 'Resume';
      character.setAttribute('aria-label', 'Resume Borhan’s portfolio tour');
      setSpeech('Paused. Take your time; I’ll wait here.');
    } else {
      pauseButton.textContent = 'Pause';
      if (moveAnimation) moveAnimation.play();
      setSpeech(activeLine);
      character.setAttribute('aria-label', 'Pause Borhan’s portfolio tour');
      if (isStarting) {
        isStarting = false;
        introTimer = window.setTimeout(function () { introTimer = null; if (isTouring && !isPaused) goToStep(0); }, 250);
        return;
      }
      scheduleNext();
    }
  }

  function returnToDock() {
    if (!guide.classList.contains('is-tour-mode')) return Promise.resolve();
    var charRect = character.getBoundingClientRect();
    if (moveAnimation) { moveAnimation.cancel(); moveAnimation = null; }
    var charWidth = window.innerWidth < 1024 ? 106 : 124;
    var charHeight = window.innerWidth < 1024 ? 143 : 166;
    var narrow = window.innerWidth < 1024;
    var rightInset = narrow ? (window.innerWidth <= 380 ? 7.2 : 10.4) : clamp(window.innerWidth * .024, 16, 36);
    var bottomInset = window.innerWidth < 1024 ? 90 : 24;
    var wrapperWidth = narrow ? (window.innerWidth <= 380 ? window.innerWidth - 14.4 : Math.min(340, window.innerWidth - 20.8)) : 360;
    guide.style.setProperty('--return-width', Math.round(wrapperWidth) + 'px');
    guide.style.setProperty('--guide-x', Math.round(charRect.left - (wrapperWidth - charWidth)) + 'px');
    guide.style.setProperty('--guide-y', Math.round(charRect.top) + 'px');
    guide.classList.add('is-returning');
    var dockX = window.innerWidth - wrapperWidth - rightInset;
    var dockY = window.innerHeight - charHeight - bottomInset;
    var from = guide.getBoundingClientRect();
    var dx = dockX - from.left;
    var dy = dockY - from.top;
    character.classList.add('is-walking');
    moveAnimation = guide.animate([
      { transform: 'translate3d(0, 0, 0)' },
      { transform: 'translate3d(' + dx + 'px, ' + dy + 'px, 0)' }
    ], { duration: reducedMotion ? 0 : 700, easing: 'cubic-bezier(.22,.68,.12,1)', fill: 'forwards' });
    var returnAnimation = moveAnimation;
    return returnAnimation.finished.catch(function () {}).then(function () {
      if (moveAnimation !== returnAnimation) return;
      guide.style.setProperty('--guide-x', Math.round(dockX) + 'px');
      guide.style.setProperty('--guide-y', Math.round(dockY) + 'px');
      returnAnimation.cancel();
      moveAnimation = null;
      character.classList.remove('is-walking');
      guide.style.removeProperty('--guide-x');
      guide.style.removeProperty('--guide-y');
      guide.style.removeProperty('--bubble-x');
      guide.style.removeProperty('--bubble-y');
      guide.style.removeProperty('--return-width');
      guide.classList.remove('is-tour-mode');
      guide.classList.remove('is-returning');
      var walkGroup = character.querySelector('.guide-walk');
      if (walkGroup) walkGroup.setAttribute('transform', 'translate(144 0) scale(-1 1)');
      if (pupils) {
        pupils.style.setProperty('--gaze-x', '0px');
        pupils.style.setProperty('--gaze-y', '0px');
      }
    });
  }

  async function finishTour() {
    isTouring = false;
    isPaused = false;
    isAtStop = false;
    travelToken++;
    window.clearTimeout(autoTimer);
    window.clearTimeout(introTimer);
    removeFocus();
    pauseButton.textContent = 'Pause';
    stepLabel.hidden = true;
    tourActions.hidden = true;
    guideMenu.hidden = true;
    menuToggle.setAttribute('aria-expanded', 'false');
    inviteActions.hidden = false;
    startButton.innerHTML = 'Take the tour again <span aria-hidden="true">↻</span>';
    laterButton.textContent = 'Close';
    activeLine = 'That’s the tour. The hard part is usually behind the scenes.';
    setSpeech(activeLine);
    await returnToDock();
    setPopoverOpen(true);
    character.setAttribute('aria-label', 'Open Borhan’s portfolio tour');
    wave();
  }

  async function exitTour() {
    if (!isTouring) { closePopover(); return; }
    isTouring = false;
    isPaused = false;
    isAtStop = false;
    travelToken++;
    window.clearTimeout(autoTimer);
    window.clearTimeout(introTimer);
    removeFocus();
    if (moveAnimation) {
      var current = character.getBoundingClientRect();
      guide.style.setProperty('--guide-x', Math.round(current.left) + 'px');
      guide.style.setProperty('--guide-y', Math.round(current.top) + 'px');
      moveAnimation.cancel();
      moveAnimation = null;
    }
    await returnToDock();
    closePopover();
  }

  function closePopover() {
    isTouring = false;
    tourActions.hidden = true;
    guideMenu.hidden = true;
    menuToggle.setAttribute('aria-expanded', 'false');
    stepLabel.hidden = true;
    inviteActions.hidden = false;
    setPopoverOpen(false);
    character.setAttribute('aria-label', 'Open Borhan’s portfolio tour');
    character.focus();
  }

  function restartTour() {
    travelToken++;
    window.clearTimeout(autoTimer);
    window.clearTimeout(introTimer);
    isTouring = false;
    isPaused = false;
    isAtStop = false;
    removeFocus();
    if (moveAnimation) {
      var current = character.getBoundingClientRect();
      guide.style.setProperty('--guide-x', Math.round(current.left) + 'px');
      guide.style.setProperty('--guide-y', Math.round(current.top) + 'px');
      moveAnimation.cancel();
      moveAnimation = null;
      character.classList.remove('is-walking');
    }
    beginTour();
  }

  function selectedTabReaction() {
    var active = document.querySelector('.tab-content[data-tab-active="true"]');
    if (!active) return;
    var lines = {
      about: 'The short version. A reliable backend makes the rest possible.',
      skills: 'A practical toolkit. Nothing in here is just for show.',
      projects: 'Pick a case study. The details are where it gets good.',
      experience: 'Production has a way of teaching you what matters.',
      contact: 'My favorite section. No pressure, just say hello.',
      services: 'A few ways I can help. The custom option is always open.'
    };
    if (isPopoverOpen) setSpeech(lines[active.getAttribute('data-tab-name')] || 'Have a look around.');
    wave();
  }

  character.addEventListener('click', function () {
    if (isTouring) { pauseTour(); return; }
    if (!isPopoverOpen) {
      setSpeech('Welcome to my portfolio. Want a quick look around?');
      inviteActions.hidden = false;
      tourActions.hidden = true;
      setPopoverOpen(true);
    } else closePopover();
  });

  startButton.addEventListener('click', beginTour);
  laterButton.addEventListener('click', closePopover);
  pauseButton.addEventListener('click', pauseTour);
  menuToggle.addEventListener('click', function () {
    guideMenu.hidden = !guideMenu.hidden;
    menuToggle.setAttribute('aria-expanded', guideMenu.hidden ? 'false' : 'true');
  });
  nextButton.addEventListener('click', function () {
    if (currentStep === steps.length - 1) finishTour();
    else goToStep(currentStep + 1);
  });
  replayButton.addEventListener('click', restartTour);
  endButton.addEventListener('click', exitTour);
  dismissButton.addEventListener('click', exitTour);

  document.addEventListener('keydown', function (event) {
    if (event.key !== 'Escape' || !isPopoverOpen) return;
    var projectModal = document.getElementById('project-modal');
    if (projectModal && !projectModal.classList.contains('hidden')) return;
    exitTour();
  });

  document.addEventListener('click', function (event) {
    if (guide.contains(event.target) || isTouring) return;
    if (event.target.closest('.tab-btn')) { selectedTabReaction(); return; }
    if (event.target.closest('.project-card')) {
      if (isPopoverOpen) setSpeech('Open a case study to see what’s under the hood.');
      wave();
      return;
    }
    if (event.target.closest('.btn-primary:not(#submit-btn)')) {
      if (isPopoverOpen) setSpeech('A good next step. I’ll leave the details to you.');
      wave();
    }
  });

  var alreadyDismissed = false;
  try { alreadyDismissed = sessionStorage.getItem('portfolioGuideDismissed') === 'true'; } catch (e) { /* Optional preference only. */ }
  function rememberDismissal() {
    alreadyDismissed = true;
    try { sessionStorage.setItem('portfolioGuideDismissed', 'true'); } catch (e) { /* Optional preference only. */ }
  }
  dismissButton.addEventListener('click', rememberDismissal);
  laterButton.addEventListener('click', rememberDismissal);

  window.addEventListener('resize', function () {
    if (!isTouring || !focusedTarget) return;
    var rect = focusedTarget.getBoundingClientRect();
    var charWidth = window.innerWidth < 1024 ? 106 : 124;
    var charHeight = window.innerWidth < 1024 ? 143 : 166;
    var x = clamp(rect.right + 15, 12, window.innerWidth - charWidth - 12);
    var y = clamp(rect.top + rect.height * .5 - charHeight * .48, 88, window.innerHeight - charHeight - 100);
    guide.style.setProperty('--guide-x', Math.round(x) + 'px');
    guide.style.setProperty('--guide-y', Math.round(y) + 'px');
    setBubblePosition(x, y, rect);
  });

  window.setTimeout(function () {
    guide.setAttribute('data-visible', 'true');
    guide.removeAttribute('aria-hidden');
    if (!alreadyDismissed) window.setTimeout(function () {
      if (!alreadyDismissed && !isTouring) {
        setPopoverOpen(true);
        wave();
      }
    }, 520);
  }, 1700);
})();

(function () {
  'use strict';

  // ===== Theme Switcher (Light/Dark Toggle) =====
  const html = document.documentElement;
  const themeBtn = document.getElementById('theme-switcher');
  const themeIcon = document.getElementById('theme-icon');
  let currentTheme = localStorage.getItem('theme') || 'dark';

  function applyTheme(theme) {
    html.setAttribute('data-theme', theme);
    currentTheme = theme;
    localStorage.setItem('theme', theme);
    themeIcon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
  }

  applyTheme(currentTheme);

  themeBtn.addEventListener('click', function () {
    applyTheme(currentTheme === 'dark' ? 'light' : 'dark');
  });

  // ===== Tab Switching =====
  function openTab(event, tabName) {
    // Hide all tab contents
    document.querySelectorAll('.tab-content').forEach(function (tab) {
      tab.style.display = 'none';
      tab.removeAttribute('data-tab-active');
    });

    // Deactivate all tab buttons
    document.querySelectorAll('.tab-btn').forEach(function (btn) {
      btn.classList.remove('tab-active');
    });

    // Activate clicked tab
    event.currentTarget.classList.add('tab-active');

    // Show selected tab content
    var targetTab = document.querySelector('[data-tab-name="' + tabName + '"]');
    if (targetTab) {
      targetTab.style.display = 'flex';
      targetTab.setAttribute('data-tab-active', 'true');
    }

    // Re-trigger counter animation if switching to about tab
    if (tabName === 'about') {
      countersAnimated = false;
      setTimeout(animateCounters, 100);
    }
  }

  // Make openTab globally available
  window.openTab = openTab;

  // Open tab by index (for cross-linking)
  function openTabByIndex(index) {
    var tabBtns = document.querySelectorAll('.tab-btn');
    if (tabBtns[index]) {
      tabBtns[index].click();
    }
  }

  window.openTabByIndex = openTabByIndex;

  // Initialize first tab
  var firstTab = document.querySelector('.tab-content[data-tab-name="about"]');
  if (firstTab) {
    firstTab.style.display = 'flex';
    firstTab.setAttribute('data-tab-active', 'true');
    // Trigger counters after first tab is visible
    setTimeout(animateCounters, 300);
  }

  // ===== Animated Counters =====
  const counters = document.querySelectorAll('[data-target]');
  let countersAnimated = false;

  function animateCounters() {
    if (countersAnimated) return;

    let shouldAnimate = false;
    counters.forEach(function (counter) {
      const top = counter.getBoundingClientRect().top;
      if (top < window.innerHeight * 0.8) shouldAnimate = true;
    });

    if (!shouldAnimate) return;
    countersAnimated = true;

    counters.forEach(function (counter) {
      const target = parseInt(counter.getAttribute('data-target'));
      const suffix = counter.getAttribute('data-suffix') || '+';
      const increment = target / 35;
      let current = 0;

      const updateCounter = function () {
        current += increment;
        if (current < target) {
          counter.textContent = Math.ceil(current);
          requestAnimationFrame(updateCounter);
        } else {
          counter.textContent = target + suffix;
        }
      };

      updateCounter();
    });
  }

  // ===== Contact Form (EmailJS) =====
  (function () {
    emailjs.init('UfmpMSg2KlcJjyIX0');
  })();

  const contactForm = document.getElementById('contact-form');
  const formMessage = document.getElementById('form-message');
  const submitBtn = document.getElementById('submit-btn');

  if (contactForm) {
    contactForm.addEventListener('submit', function (e) {
      e.preventDefault();

      const name = document.getElementById('name').value.trim();
      const email = document.getElementById('email').value.trim();
      const message = document.getElementById('message').value.trim();

      if (!name || !email || !message) {
        showFormMessage('Please fill in all required fields.', false);
        return;
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showFormMessage('Please enter a valid email address.', false);
        return;
      }

      submitBtn.textContent = 'Sending...';
      submitBtn.disabled = true;

      emailjs.sendForm('service_vxkwckv', 'template_txkht7q', this)
        .then(function () {
          showFormMessage('Message sent successfully!', true);
          contactForm.reset();
          submitBtn.textContent = 'Send Message';
          submitBtn.disabled = false;
        }, function () {
          showFormMessage('Failed to send message. Please try again.', false);
          submitBtn.textContent = 'Send Message';
          submitBtn.disabled = false;
        });
    });
  }

  function showFormMessage(text, isSuccess) {
    formMessage.textContent = text;
    formMessage.className = 'block text-xs text-center py-2.5 rounded-lg';
    if (isSuccess) {
      formMessage.classList.add('bg-emerald-500/10', 'text-emerald-600', 'border', 'border-emerald-500/15');
    } else {
      formMessage.classList.add('bg-red-500/10', 'text-red-600', 'border', 'border-red-500/15');
    }
    setTimeout(function () {
      formMessage.classList.add('hidden');
    }, 5000);
  }
})();

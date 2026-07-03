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

  // ===== Typing Effect =====
  const typingText = document.getElementById('typing-text');
  const roles = [
    'scalable APIs',
    'SaaS platforms',
    'enterprise systems',
    'clean architecture',
    '.NET solutions',
  ];
  let roleIndex = 0;
  let charIndex = 0;
  let isDeleting = false;

  function typeEffect() {
    const current = roles[roleIndex];
    if (isDeleting) {
      typingText.textContent = current.substring(0, charIndex - 1);
      charIndex--;
    } else {
      typingText.textContent = current.substring(0, charIndex + 1);
      charIndex++;
    }

    if (!isDeleting && charIndex === current.length) {
      isDeleting = true;
      setTimeout(typeEffect, 2000);
      return;
    }

    if (isDeleting && charIndex === 0) {
      isDeleting = false;
      roleIndex = (roleIndex + 1) % roles.length;
      setTimeout(typeEffect, 500);
      return;
    }

    setTimeout(typeEffect, isDeleting ? 50 : 80);
  }

  typeEffect();

  // ===== Scroll Reveal =====
  function revealOnScroll() {
    const reveals = document.querySelectorAll('.reveal');
    const windowHeight = window.innerHeight;
    const revealPoint = 100;

    reveals.forEach((el) => {
      const revealTop = el.getBoundingClientRect().top;
      if (revealTop < windowHeight - revealPoint) {
        el.classList.add('revealed');
      }
    });
  }

  revealOnScroll();
  window.addEventListener('scroll', revealOnScroll);

  // ===== Scroll Progress =====
  const progressBar = document.getElementById('scroll-progress');

  function updateProgress() {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    progressBar.style.width = progress + '%';
  }

  window.addEventListener('scroll', updateProgress);

  // ===== Animated Counters =====
  const counters = document.querySelectorAll('[data-target]');
  let countersAnimated = false;

  function animateCounters() {
    if (countersAnimated) return;

    let shouldAnimate = false;
    counters.forEach((counter) => {
      const top = counter.getBoundingClientRect().top;
      if (top < window.innerHeight * 0.8) shouldAnimate = true;
    });

    if (!shouldAnimate) return;
    countersAnimated = true;

    counters.forEach((counter) => {
      const target = parseInt(counter.getAttribute('data-target'));
      const increment = target / 35;
      let current = 0;

      const updateCounter = () => {
        current += increment;
        if (current < target) {
          counter.textContent = Math.ceil(current);
          requestAnimationFrame(updateCounter);
        } else {
          counter.textContent = target + '+';
        }
      };

      updateCounter();
    });
  }

  window.addEventListener('scroll', animateCounters);
  setTimeout(animateCounters, 500);

  // ===== Back to Top =====
  const backToTop = document.getElementById('back-to-top');

  window.addEventListener('scroll', function () {
    if (window.scrollY > 400) {
      backToTop.classList.add('visible');
    } else {
      backToTop.classList.remove('visible');
    }
  });

  backToTop.addEventListener('click', function () {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // ===== Smooth Scroll =====
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', function (e) {
      const href = this.getAttribute('href');
      if (href === '#') return;
      e.preventDefault();
      const target = document.querySelector(href);
      if (target) {
        const top = target.getBoundingClientRect().top + window.scrollY - 60;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });

  // ===== Contact Form =====
  const contactForm = document.getElementById('contact-form');
  const formMessage = document.getElementById('form-message');

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

      const mailtoLink =
        'mailto:mdborhan.dev@gmail.com' +
        '?subject=' + encodeURIComponent(document.getElementById('subject').value || 'Portfolio Contact') +
        '&body=' + encodeURIComponent('Name: ' + name + '\nEmail: ' + email + '\n\nMessage:\n' + message);

      window.open(mailtoLink, '_blank');
      showFormMessage('Thank you! Your message has been prepared.', true);
      contactForm.reset();
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
    setTimeout(() => formMessage.classList.add('hidden'), 5000);
  }

  // ===== Init =====
  updateProgress();
})();

(function () {
  'use strict';

  // ===== Theme =====
  // Dark ("night") only. Tokens live on :root in style.css, so there is no
  // theme state to read or write — we just clear any value left behind by the
  // old light/dark switcher so nothing can flip the site back to light.
  const html = document.documentElement;

  html.setAttribute('data-theme', 'dark');

  try {
    localStorage.removeItem('theme');
  } catch (e) {
    /* Private mode / storage blocked — dark is the default anyway. */
  }

  // ===== A quieter, scroll-led reveal system =====
  var revealObserver = null;
  var revealSelector = '.tab-panel-inner > *, .project-card, .timeline-container, .stack-col, #contact-form .grid > *';

  function setupRevealMotion(scope) {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    if (!('IntersectionObserver' in window)) {
      (scope || document).querySelectorAll(revealSelector).forEach(function (item) {
        item.classList.add('is-revealed');
      });
      return;
    }

    if (!revealObserver) {
      revealObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-revealed');
          revealObserver.unobserve(entry.target);
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    }

    (scope || document).querySelectorAll(revealSelector).forEach(function (item, index) {
      if (item.classList.contains('is-revealed')) return;
      item.classList.add('motion-reveal');
      item.style.setProperty('--reveal-delay', Math.min(index % 4, 3) * 65 + 'ms');
      revealObserver.observe(item);
    });
  }

  setupRevealMotion();

  var heroHeading = document.querySelector('.heading-xl');
  if (heroHeading && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    heroHeading.classList.add('hero-reveal');
  }

  // The portrait and main actions respond just enough to reward a pointer.
  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches &&
      !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.querySelectorAll('.btn-primary').forEach(function (button) {
      button.classList.add('magnetic-control');
      button.addEventListener('pointermove', function (event) {
        var rect = button.getBoundingClientRect();
        var x = (event.clientX - rect.left - rect.width / 2) / rect.width;
        var y = (event.clientY - rect.top - rect.height / 2) / rect.height;
        button.style.setProperty('--mag-x', (x * 5).toFixed(2) + 'px');
        button.style.setProperty('--mag-y', (y * 4).toFixed(2) + 'px');
      });
      button.addEventListener('pointerleave', function () {
        button.style.setProperty('--mag-x', '0px');
        button.style.setProperty('--mag-y', '0px');
      });
    });

    var portrait = document.querySelector('.sidebar-panel > .relative > div');
    if (portrait) {
      portrait.addEventListener('pointermove', function (event) {
        var rect = portrait.getBoundingClientRect();
        var x = (event.clientX - rect.left) / rect.width - .5;
        var y = (event.clientY - rect.top) / rect.height - .5;
        portrait.style.setProperty('--portrait-x', (x * 2).toFixed(2) + 'deg');
        portrait.style.setProperty('--portrait-y', (y * -2).toFixed(2) + 'deg');
      });
      portrait.addEventListener('pointerleave', function () {
        portrait.style.setProperty('--portrait-x', '0deg');
        portrait.style.setProperty('--portrait-y', '0deg');
      });
    }
  }

  // ===== Tab Switching =====
  var tabLeaveTimer = null;

  function getTabByName(tabName) {
    return document.querySelector('[data-tab-name="' + tabName + '"]');
  }

  function collectMotionItems(tab) {
    var selectors = [
      '.tab-panel-inner > *',
      '.timeline-container',
      '.project-card',
      '.skill-badge',
      '.link',
      '.btn-primary',
      '.btn-outline',
      '#contact-form > *',
      '#contact-form .grid > *'
    ];
    var items = [];
    var seen = new Set();

    selectors.forEach(function (selector) {
      tab.querySelectorAll(selector).forEach(function (item) {
        if (seen.has(item)) return;
        seen.add(item);
        items.push(item);
      });
    });

    return items;
  }

  function replayTabMotion(tab) {
    var items = collectMotionItems(tab);

    items.forEach(function (item) {
      item.classList.remove('tab-motion-item');
      item.style.removeProperty('--tab-item-index');
    });

    void tab.offsetWidth;

    items.forEach(function (item, index) {
      item.style.setProperty('--tab-item-index', index);
      item.classList.add('tab-motion-item');
    });
  }

  function openTab(event, tabName) {
    var targetTab = getTabByName(tabName);
    if (!targetTab) return;

    var currentTab = document.querySelector('.tab-content[data-tab-active="true"]');
    var isSameTab = currentTab === targetTab;

    // Finish an interrupted outgoing transition before selecting the next panel.
    document.querySelectorAll('.tab-content[data-tab-state="leaving"]').forEach(function (tab) {
      tab.removeAttribute('data-tab-state');
    });
    if (!isSameTab && scrollContainer) scrollContainer.scrollTop = 0;

    // Keep the tab pattern's selected state in sync for keyboard and screen reader users.
    document.querySelectorAll('.tab-btn').forEach(function (btn) {
      btn.classList.remove('tab-active');
      var selected = btn.getAttribute('data-tab-target') === tabName;
      btn.setAttribute('aria-selected', selected ? 'true' : 'false');
      btn.tabIndex = selected ? 0 : -1;
    });

    // Activate clicked tab
    if (event && event.currentTarget) {
      event.currentTarget.classList.add('tab-active');
    }

    if (tabLeaveTimer) {
      clearTimeout(tabLeaveTimer);
      tabLeaveTimer = null;
    }

    if (currentTab && !isSameTab) {
      currentTab.setAttribute('data-tab-state', 'leaving');
      currentTab.removeAttribute('data-tab-active');
      currentTab.setAttribute('data-tab-hidden', 'true');
      currentTab.setAttribute('aria-hidden', 'true');
      tabLeaveTimer = setTimeout(function () {
        currentTab.removeAttribute('data-tab-state');
      }, 420);
    }

    targetTab.removeAttribute('data-tab-hidden');
    targetTab.setAttribute('aria-hidden', 'false');
    targetTab.setAttribute('data-tab-active', 'true');
    targetTab.setAttribute('data-tab-state', 'entering');
    replayTabMotion(targetTab);
    setupRevealMotion(targetTab);

    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        if (targetTab.getAttribute('data-tab-active') === 'true') {
          targetTab.setAttribute('data-tab-state', 'active');
        }
      });
    });
    requestAnimationFrame(updateScrollProgress);
    // Re-trigger counter animation if switching to about tab
    if (tabName === 'about' && window.resetCounters) {
      setTimeout(window.resetCounters, 100);
    }
  }

  // Make openTab globally available
  window.openTab = openTab;

  var tabList = document.querySelector('[role="tablist"]');
  if (tabList) {
    tabList.addEventListener('click', function (event) {
      var button = event.target.closest('.tab-btn[data-tab-target]');
      if (button) openTab({ currentTarget: button }, button.getAttribute('data-tab-target'));
    });
    tabList.addEventListener('keydown', function (event) {
      var buttons = Array.prototype.slice.call(tabList.querySelectorAll('.tab-btn[data-tab-target]'));
      var currentIndex = buttons.indexOf(event.target);
      if (currentIndex < 0) return;
      var nextIndex = currentIndex;
      if (event.key === 'ArrowRight') nextIndex = (currentIndex + 1) % buttons.length;
      else if (event.key === 'ArrowLeft') nextIndex = (currentIndex - 1 + buttons.length) % buttons.length;
      else if (event.key === 'Home') nextIndex = 0;
      else if (event.key === 'End') nextIndex = buttons.length - 1;
      else return;
      event.preventDefault();
      buttons[nextIndex].focus();
      buttons[nextIndex].click();
    });
  }

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
    firstTab.removeAttribute('data-tab-hidden');
    firstTab.setAttribute('data-tab-active', 'true');
    firstTab.setAttribute('data-tab-state', 'active');
    firstTab.setAttribute('aria-hidden', 'false');
    replayTabMotion(firstTab);
  }

  // Hide all other tabs initially (using data attribute, not display:none)
  document.querySelectorAll('.tab-content:not([data-tab-name="about"])').forEach(function(tab) {
    tab.setAttribute('data-tab-hidden', 'true');
    tab.setAttribute('aria-hidden', 'true');
  });
  if (firstTab) setupRevealMotion(firstTab);

  // ===== Animated Counters =====
  function animateSingleCounter(counter) {
    if (counter.dataset.animated) return;
    counter.dataset.animated = 'true';
    const target = parseInt(counter.getAttribute('data-target'));
    const suffix = counter.getAttribute('data-suffix') || '+';
    const duration = 1500;
    const startTime = performance.now();

    function update(now) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      counter.textContent = Math.ceil(eased * target) + (progress >= 1 ? suffix : '');
      if (progress < 1) requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
  }

  function setupCounterObserver() {
    const counters = document.querySelectorAll('[data-target]');
    if (!counters.length) return;

    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            animateSingleCounter(entry.target);
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.1 });

      counters.forEach(function (counter) {
        counter.dataset.animated = '';
        observer.observe(counter);
      });

      // Also expose a reset function for tab switching
      window.resetCounters = function () {
        counters.forEach(function (c) {
          c.dataset.animated = '';
          c.textContent = '0';
        });
        // Re-observe
        counters.forEach(function (counter) {
          observer.observe(counter);
        });
      };
    } else {
      // Fallback: just show final values
      counters.forEach(function (counter) {
        const target = parseInt(counter.getAttribute('data-target'));
        const suffix = counter.getAttribute('data-suffix') || '+';
        counter.textContent = target + suffix;
      });
    }
  }

  setupCounterObserver();

  // ===== Scroll Progress =====
  var scrollProgress = document.getElementById('scroll-progress');
  var scrollContainer = document.querySelector('main > div > div.flex-1.overflow-y-auto') || document.querySelector('.flex-1.overflow-y-auto') || document.scrollingElement || document.documentElement;

  function updateScrollProgress() {
    if (!scrollProgress || !scrollContainer) return;

    var scrollTop = scrollContainer.scrollTop || 0;
    var scrollHeight = scrollContainer.scrollHeight || 0;
    var clientHeight = scrollContainer.clientHeight || 0;
    var maxScroll = scrollHeight - clientHeight;
    var progress = maxScroll > 0 ? (scrollTop / maxScroll) * 100 : 0;

    scrollProgress.style.transform = 'scaleX(' + progress / 100 + ')';
  }

  if (scrollContainer) {
    scrollContainer.addEventListener('scroll', updateScrollProgress, { passive: true });
  }
  window.addEventListener('resize', updateScrollProgress);
  requestAnimationFrame(updateScrollProgress);

  // ===== Direct Service Request & Cross-linking =====
  window.requestCustomService = function (serviceName) {
    openTabByIndex(4); // Switch to Contact tab
    setTimeout(function () {
      var serviceSelect = document.getElementById('service-select');
      var subjectInput = document.getElementById('subject');
      var messageInput = document.getElementById('message');

      if (serviceSelect && serviceName) {
        // Try matching select option or fallback to Custom
        var matched = false;
        for (var i = 0; i < serviceSelect.options.length; i++) {
          if (serviceSelect.options[i].value.toLowerCase().includes(serviceName.toLowerCase()) ||
              serviceName.toLowerCase().includes(serviceSelect.options[i].value.toLowerCase())) {
            serviceSelect.selectedIndex = i;
            matched = true;
            break;
          }
        }
        if (!matched) {
          serviceSelect.value = 'Other / Custom Inquiry';
        }
      }

      if (subjectInput && serviceName) {
        subjectInput.value = 'Inquiry: ' + serviceName;
      }

      if (messageInput) {
        messageInput.focus();
      }
    }, 300);
  };

  // Load the contact provider only when a visitor submits the form.
  var emailJsPromise;
  function loadEmailJS() {
    if (window.emailjs) return Promise.resolve(window.emailjs);
    if (!emailJsPromise) {
      emailJsPromise = new Promise(function (resolve, reject) {
        var provider = document.createElement('script');
        provider.src = 'https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js';
        provider.async = true;
        provider.onload = function () {
          if (!window.emailjs) {
            emailJsPromise = null;
            provider.remove();
            return reject(new Error('Email service failed to initialize.'));
          }
          try {
            window.emailjs.init('UfmpMSg2KlcJjyIX0');
            resolve(window.emailjs);
          } catch (error) {
            emailJsPromise = null;
            reject(error);
          }
        };
        provider.onerror = function () {
          emailJsPromise = null;
          provider.remove();
          reject(new Error('Email service failed to load.'));
        };
        document.head.appendChild(provider);
      });
    }
    return emailJsPromise;
  }

  const contactForm = document.getElementById('contact-form');
  const formMessage = document.getElementById('form-message');
  const submitBtn = document.getElementById('submit-btn');
  var formMessageTimer = null;

  if (contactForm) {
    contactForm.addEventListener('submit', function (e) {
      e.preventDefault();

      const name = document.getElementById('name').value.trim();
      const email = document.getElementById('email').value.trim();
      const service = document.getElementById('service-select').value.trim();
      const budget = document.getElementById('budget-select').value.trim();
      const subject = document.getElementById('subject').value.trim();
      const messageInput = document.getElementById('message');
      const message = messageInput.value.trim();

      if (!name || !email || !message) {
        showFormMessage('Please fill in all required fields.', false);
        return;
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showFormMessage('Please enter a valid email address.', false);
        return;
      }

      var originalBtnHtml = submitBtn.innerHTML;
      submitBtn.innerHTML = '<i class="hgi-stroke hgi-loading-02 animate-spin text-sm" aria-hidden="true"></i> Sending Requirement...';
      submitBtn.disabled = true;
      contactForm.setAttribute('aria-busy', 'true');

      // EmailJS templates commonly render only {{message}} in the email body.
      // Merge every form value into it so no project information is omitted.
      const mergedMessage = [
        'Project Inquiry',
        '================',
        'Name: ' + name,
        'Email: ' + email,
        'Service Needed: ' + (service || 'Not provided'),
        'Estimated Budget: ' + (budget || 'Not provided'),
        'Project Title / Short Summary: ' + (subject || 'Not provided'),
        '',
        'Project Details & Requirements:',
        message
      ].join('\n');
      messageInput.value = mergedMessage;

      loadEmailJS().then(function (emailjs) {
        return emailjs.sendForm('service_vxkwckv', 'template_txkht7q', contactForm);
      })
        .then(function () {
          showFormMessage('Thank you! Your project requirement has been sent. I will review it and reply within 24 hours.', true);
          contactForm.reset();
          submitBtn.innerHTML = originalBtnHtml;
          submitBtn.disabled = false;
          contactForm.removeAttribute('aria-busy');
        }, function (error) {
          console.error('EmailJS Error:', error);
          showFormMessage('Failed to send message via web form. Please email directly to mdborhan.dev@gmail.com or message on WhatsApp.', false);
          messageInput.value = message;
          submitBtn.innerHTML = originalBtnHtml;
          submitBtn.disabled = false;
          contactForm.removeAttribute('aria-busy');
        });
    });
  }

  function showFormMessage(text, isSuccess) {
    window.clearTimeout(formMessageTimer);
    formMessage.textContent = text;
    formMessage.className = 'form-message is-visible ' + (isSuccess ? 'is-success' : 'is-error');
    formMessageTimer = setTimeout(function () {
      formMessage.classList.remove('is-visible');
    }, 7000);
  }

  // ===== Detailed Project Case Studies =====
  var projects = {
    halda: {
      tag: 'Enterprise SaaS HRM',
      title: 'Halda - Multi-Tenant Enterprise HRM',
      desc: 'Architected and built a multi-tenant Human Resource Management SaaS platform for enterprise-scale organizations. Solved data isolation and automated complex salary formulas across multiple shifts.',
      features: [
        'Multi-tenant architecture with separate tenant databases & shared cache',
        'Automated payroll engine with tax calculations, bonus rules & deductions',
        'Real-time biometric & web attendance tracking with shift schedules',
        'Fine-grained Role-Based Access Control (RBAC) with dynamic permission matrices',
        'Employee lifecycle management: Onboarding, probation, reviews & offboarding',
        'Comprehensive audit logging and performance appraisal workflows'
      ],
      tech: ['ASP.NET Core', 'Entity Framework Core', 'PostgreSQL', 'JWT Auth', 'RBAC', 'Clean Architecture'],
      ctaService: 'SaaS Platform Development'
    },
    erp: {
      tag: 'ERP Platform',
      title: 'Enterprise ERP & Supply Chain System',
      desc: 'Engineered an end-to-end ERP platform unifying procurement, multi-warehouse inventory management, vendor lifecycle, and financial general ledgers into automated approval workflows.',
      features: [
        'Multi-warehouse stock tracking with automated reorder triggers',
        'Supply chain & vendor quote comparison engine',
        'Multi-level hierarchy approval engine for purchase orders',
        'General ledger integration with double-entry accounting entries',
        'Departmental analytics dashboards & exportable audit reports',
        'Strict concurrency handling to eliminate duplicate transactions'
      ],
      tech: ['ASP.NET Core', 'Entity Framework Core', 'PostgreSQL', 'Clean Architecture', 'SOLID Principles'],
      ctaService: 'Custom Enterprise Software'
    },
    atrai: {
      tag: 'FinTech & Accounting',
      title: 'Atrai - Automated Accounting System',
      desc: 'Designed a reliable financial management system for SMEs and enterprises providing real-time ledger generation, automated bank reconciliation, and multi-currency billing.',
      features: [
        'Double-entry general ledger with automatic debit/credit balancing',
        'Invoice generation, PDF export, and payment status tracking',
        'Automated bank statement reconciliation and transaction matching',
        'Real-time financial statements (Profit & Loss, Balance Sheet, Cash Flow)',
        'VAT / Tax computation engine with customizable fiscal rules',
        'Multi-currency transaction support and exchange rate auditing'
      ],
      tech: ['ASP.NET Core', 'Entity Framework Core', 'PostgreSQL', 'RESTful API', 'Clean Architecture'],
      ctaService: 'REST API & Backend Development'
    },
    okr: {
      tag: 'Productivity & Goal Alignment',
      title: 'Enterprise OKR & KPI Tracking Platform',
      desc: 'Built an objectives and key results tracking application connecting executive goals with team sprints, progress velocity, and measurable KPI benchmarks.',
      features: [
        'Quarterly & yearly OKR planning with cascading parent-child goal relations',
        'Dynamic key result tracking with custom metric milestones & sliders',
        'Automated weekly check-in reminders and confidence scoring',
        'Interactive team leaderboards and executive progress dashboards',
        'Sprint task board integration linking daily work directly to OKRs'
      ],
      tech: ['ASP.NET Core', 'Entity Framework Core', 'PostgreSQL', 'RESTful API'],
      ctaService: 'Custom Enterprise Software'
    },
    smartslead: {
      tag: 'CRM & Pipeline Automation',
      title: 'SmartSLead - Sales & Pipeline CRM',
      desc: 'A sales execution CRM focusing on lead ingestion, drag-and-drop pipeline stages, deal velocity analytics, and automated sales rep task assignment.',
      features: [
        'Visual drag-and-drop Kanban sales pipeline for deal progression',
        'Multi-source lead capture with automated qualification scoring',
        'Contact & organization hierarchy management with interaction timelines',
        'Conversion funnel analytics and quarterly revenue forecasting',
        'Automated follow-up reminders and team activity tracking'
      ],
      tech: ['ASP.NET Core', 'Entity Framework Core', 'PostgreSQL', 'RESTful API'],
      ctaService: 'SaaS Platform Development'
    }
  };

  var modal = document.getElementById('project-modal');
  var modalTag = document.getElementById('modal-tag');
  var modalTitle = document.getElementById('modal-title');
  var modalDesc = document.getElementById('modal-desc');
  var modalFeatures = document.getElementById('modal-features');
  var modalTech = document.getElementById('modal-tech');
  var modalTrigger = null;
  var modalCloseTimer = null;

  document.querySelectorAll('.project-card[role="button"]').forEach(function (card) {
    card.addEventListener('keydown', function (event) {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      card.click();
    });
  });

  window.openModal = function (projectKey, trigger) {
    var p = projects[projectKey];
    if (!p) return;

    if (modalCloseTimer) {
      clearTimeout(modalCloseTimer);
      modalCloseTimer = null;
    }
    modalTrigger = trigger || document.activeElement;

    modalTag.textContent = p.tag;
    modalTitle.textContent = p.title;
    modalDesc.textContent = p.desc;

    modalFeatures.innerHTML = '';
    p.features.forEach(function (f) {
      var li = document.createElement('li');
      li.className = 'flex items-start gap-2.5 text-xs text-muted max-md:text-11';
      li.innerHTML = '<span class="text-[var(--accent)] mt-0.5 text-10">&#9656;</span><span>' + f + '</span>';
      modalFeatures.appendChild(li);
    });

    modalTech.innerHTML = '';
    p.tech.forEach(function (t) {
      var span = document.createElement('span');
      span.className = 'text-[10px] px-2 py-0.5 rounded bg-[var(--accent)]/5 border border-[var(--accent)]/8 text-[var(--accent)]/70 font-medium';
      span.textContent = t;
      modalTech.appendChild(span);
    });

    // Add direct CTA button to modal
    var existingModalCta = document.getElementById('modal-cta-btn');
    if (existingModalCta) {
      existingModalCta.remove();
    }
    
    var modalContent = modal.querySelector('.modal-content');
    var ctaContainer = document.createElement('div');
    ctaContainer.id = 'modal-cta-btn';
    ctaContainer.className = 'mt-6 pt-4 border-t border-[var(--accent)]/15 flex items-center justify-between gap-3';
    ctaContainer.innerHTML = '<span class="text-xs text-muted">Need a similar solution?</span>' +
      '<button type="button" class="btn-primary !py-2 !px-4 text-xs flex items-center gap-1.5">' +
      '<span>Inquire for Similar Project</span> <i class="hgi-stroke hgi-arrow-right-01 text-xs"></i>' +
      '</button>';
    
    ctaContainer.querySelector('button').addEventListener('click', function () {
      closeModal();
      requestCustomService(p.ctaService || p.title);
    });

    modalContent.appendChild(ctaContainer);

    modal.classList.remove('hidden');
    modal.setAttribute('aria-hidden', 'false');
    requestAnimationFrame(function () {
      modal.classList.add('modal-show');
      document.getElementById('modal-close').focus();
    });
    document.body.style.overflow = 'hidden';
  };

  window.closeModal = function (e) {
    if (e && e.target !== modal) return;
    if (modal.classList.contains('hidden') || modalCloseTimer) return;
    modal.classList.remove('modal-show');
    modalCloseTimer = setTimeout(function () {
      modal.classList.add('hidden');
      modal.setAttribute('aria-hidden', 'true');
      modalCloseTimer = null;
      document.body.style.overflow = '';
      if (modalTrigger && modalTrigger.isConnected && !modalTrigger.closest('[aria-hidden="true"]')) {
        modalTrigger.focus();
      }
      modalTrigger = null;
    }, 300);
  };

  document.addEventListener('keydown', function (e) {
    if (modal.classList.contains('hidden')) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      window.closeModal();
      return;
    }
    if (e.key !== 'Tab') return;
    var focusable = modal.querySelectorAll('button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])');
    if (!focusable.length) return;
    var first = focusable[0];
    var last = focusable[focusable.length - 1];
    if (e.shiftKey && (document.activeElement === first || !modal.contains(document.activeElement))) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && (document.activeElement === last || !modal.contains(document.activeElement))) {
      e.preventDefault();
      first.focus();
    }
  });
})();

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
    themeIcon.className = theme === 'dark' ? 'hgi-stroke hgi-sun-01' : 'hgi-stroke hgi-moon';
  }

  applyTheme(currentTheme);

  themeBtn.addEventListener('click', function () {
    applyTheme(currentTheme === 'dark' ? 'light' : 'dark');
  });

  // ===== Sidebar Entrance Motion =====
  function setupSidebarMotion() {
    var sidebar = document.querySelector('.sidebar-panel');
    if (!sidebar) return;

    var items = Array.prototype.slice.call(sidebar.children);
    items.forEach(function (item, index) {
      item.classList.add('sidebar-motion-item');
      item.style.setProperty('--sidebar-item-index', index);
    });

    if (items[0]) {
      items[0].classList.add('sidebar-motion-hero');
    }

    if (items[4]) {
      items[4].classList.add('sidebar-motion-badge');
    }

    if (items[6]) {
      items[6].classList.add('sidebar-motion-socials');
    }

    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        sidebar.classList.add('sidebar-ready');
      });
    });
  }

  setupSidebarMotion();

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

    // Deactivate all tab buttons first so the active tab can re-apply cleanly.
    document.querySelectorAll('.tab-btn').forEach(function (btn) {
      btn.classList.remove('tab-active');
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
      tabLeaveTimer = setTimeout(function () {
        currentTab.classList.add('hidden');
        currentTab.removeAttribute('data-tab-state');
      }, 420);
    }

    targetTab.classList.remove('hidden');
    targetTab.setAttribute('data-tab-active', 'true');
    targetTab.setAttribute('data-tab-state', 'entering');
    replayTabMotion(targetTab);

    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        targetTab.setAttribute('data-tab-state', 'active');
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
    firstTab.classList.remove('hidden');
    firstTab.setAttribute('data-tab-active', 'true');
    firstTab.setAttribute('data-tab-state', 'active');
    replayTabMotion(firstTab);
  }

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
  var scrollContainer = document.querySelector('main > div > div.flex-1.overflow-y-auto') || document.scrollingElement || document.documentElement;

  function updateScrollProgress() {
    if (!scrollProgress || !scrollContainer) return;

    var scrollTop = scrollContainer.scrollTop || 0;
    var scrollHeight = scrollContainer.scrollHeight || 0;
    var clientHeight = scrollContainer.clientHeight || 0;
    var maxScroll = scrollHeight - clientHeight;
    var progress = maxScroll > 0 ? (scrollTop / maxScroll) * 100 : 0;

    scrollProgress.style.width = progress + '%';
  }

  if (scrollContainer) {
    scrollContainer.addEventListener('scroll', updateScrollProgress, { passive: true });
  }
  window.addEventListener('resize', updateScrollProgress);
  requestAnimationFrame(updateScrollProgress);

  // ===== Direct Service Request & Cross-linking =====
  window.requestCustomService = function (serviceName) {
    openTabByIndex(5); // Switch to Contact tab
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
      submitBtn.innerHTML = '<i class="hgi-stroke hgi-loading-02 animate-spin text-sm"></i> Sending Requirement...';
      submitBtn.disabled = true;

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

      emailjs.sendForm('service_vxkwckv', 'template_txkht7q', this)
        .then(function () {
          showFormMessage('Thank you! Your project requirement has been sent. I will review it and reply within 24 hours.', true);
          contactForm.reset();
          submitBtn.innerHTML = originalBtnHtml;
          submitBtn.disabled = false;
        }, function (error) {
          console.error('EmailJS Error:', error);
          showFormMessage('Failed to send message via web form. Please email directly to mdborhan.dev@gmail.com or message on WhatsApp.', false);
          messageInput.value = message;
          submitBtn.innerHTML = originalBtnHtml;
          submitBtn.disabled = false;
        });
    });
  }

  function showFormMessage(text, isSuccess) {
    formMessage.textContent = text;
    formMessage.className = 'block text-xs text-center py-3 rounded-lg font-medium';
    if (isSuccess) {
      formMessage.classList.add('bg-emerald-500/15', 'text-emerald-400', 'border', 'border-emerald-500/25');
    } else {
      formMessage.classList.add('bg-red-500/15', 'text-red-400', 'border', 'border-red-500/25');
    }
    setTimeout(function () {
      formMessage.classList.add('hidden');
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

  window.openModal = function (projectKey) {
    var p = projects[projectKey];
    if (!p) return;

    modalTag.textContent = p.tag;
    modalTitle.textContent = p.title;
    modalDesc.textContent = p.desc;

    modalFeatures.innerHTML = '';
    p.features.forEach(function (f) {
      var li = document.createElement('li');
      li.className = 'flex items-start gap-2.5 text-xs text-muted max-md:text-[11px]';
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
      '<button class="btn-primary !py-2 !px-4 text-xs flex items-center gap-1.5">' +
      '<span>Inquire for Similar Project</span> <i class="hgi-stroke hgi-arrow-right-01 text-xs"></i>' +
      '</button>';
    
    ctaContainer.querySelector('button').addEventListener('click', function () {
      closeModal();
      requestCustomService(p.ctaService || p.title);
    });

    modalContent.appendChild(ctaContainer);

    modal.classList.remove('hidden');
    requestAnimationFrame(function () {
      modal.classList.add('modal-show');
    });
    document.body.style.overflow = 'hidden';
  };

  window.closeModal = function (e) {
    if (e && e.target !== modal) return;
    modal.classList.remove('modal-show');
    setTimeout(function () {
      modal.classList.add('hidden');
    }, 300);
    document.body.style.overflow = '';
  };

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
      window.closeModal();
    }
  });
})();

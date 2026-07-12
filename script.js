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
    firstTab.style.display = 'flex';
    firstTab.setAttribute('data-tab-active', 'true');
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

  // ===== Project Modals =====
  var projects = {
    halda: {
      tag: 'Enterprise',
      title: 'Halda - Enterprise SaaS HRM',
      desc: 'A comprehensive multi-tenant Human Resource Management system designed for enterprise-level organizations. Built with Clean Architecture and modern .NET practices to handle complex HR workflows at scale.',
      features: [
        'Multi-tenant architecture with isolated data per organization',
        'Payroll management with automated salary calculations',
        'Attendance tracking with shift scheduling',
        'Role-Based Access Control (RBAC) with granular permissions',
        'Performance review and appraisal management',
        'Employee onboarding and offboarding workflows',
        'Reporting and analytics dashboards'
      ],
      tech: ['ASP.NET Core', 'Entity Framework Core', 'PostgreSQL', 'JWT Auth', 'RBAC', 'Clean Architecture']
    },
    erp: {
      tag: 'ERP',
      title: 'Enterprise ERP System',
      desc: 'A full-featured Enterprise Resource Planning system integrating inventory, supply chain, human resources, and finance modules with automated workflow engine.',
      features: [
        'Inventory management with real-time stock tracking',
        'Supply chain management and vendor tracking',
        'HR module with employee lifecycle management',
        'Finance module with general ledger and reporting',
        'Workflow automation for approval processes',
        'Role-based dashboards for different departments',
        'Audit logging and compliance tracking'
      ],
      tech: ['ASP.NET Core', 'Entity Framework Core', 'PostgreSQL', 'Clean Architecture', 'SOLID Principles']
    },
    atrai: {
      tag: 'Finance',
      title: 'Atrai - Accounting System',
      desc: 'A modern accounting system providing comprehensive financial management capabilities including expense tracking, general ledger, and financial reporting.',
      features: [
        'Expense tracking and categorization',
        'General ledger with double-entry bookkeeping',
        'Financial reporting with profit & loss statements',
        'Bank reconciliation and transaction matching',
        'Invoice generation and management',
        'Tax calculation and reporting',
        'Analytics dashboards with key financial metrics'
      ],
      tech: ['ASP.NET Core', 'Entity Framework Core', 'PostgreSQL', 'RESTful API']
    },
    okr: {
      tag: 'Productivity',
      title: 'OKR & Task Management',
      desc: 'An objectives and key results platform with integrated task management, designed to align team goals with organizational strategy.',
      features: [
        'OKR creation and tracking with progress indicators',
        'KPI monitoring with customizable metrics',
        'Goal alignment across departments',
        'Task management with priorities and deadlines',
        'Analytics dashboards for performance insights',
        'Team collaboration and status updates',
        'Automated progress reporting'
      ],
      tech: ['ASP.NET Core', 'Entity Framework Core', 'PostgreSQL', 'RESTful API']
    },
    smartslead: {
      tag: 'CRM',
      title: 'SmartSLead - CRM',
      desc: 'A customer relationship management system focused on lead tracking, sales pipeline management, and conversion analytics.',
      features: [
        'Lead capture and qualification workflows',
        'Sales pipeline with stage-based tracking',
        'Contact and company management',
        'Conversion analytics and reporting',
        'Email integration for communication tracking',
        'Task and follow-up reminders',
        'Sales forecasting and target management'
      ],
      tech: ['ASP.NET Core', 'Entity Framework Core', 'PostgreSQL', 'RESTful API']
    },
    services: {
      tag: 'Services',
      title: 'What I Can Do For You',
      desc: 'I build scalable backend systems and SaaS platforms. Click a service to inquire about it.',
      features: [
        'Custom Software Development',
        'Backend API Development',
        'SaaS Platform Development',
        'Database Design & Optimization',
        'Website Development'
      ],
      tech: ['ASP.NET Core', 'C#', 'PostgreSQL', 'Entity Framework Core'],
      clickable: true
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
      if (p.clickable) {
        li.className = 'flex items-center gap-2.5 text-xs text-muted max-md:text-[11px] p-2.5 rounded-lg bg-card border border-[var(--accent)]/8 hover:border-[var(--accent)]/25 cursor-pointer transition-all duration-300';
        li.innerHTML = '<i class="fas fa-arrow-right text-[var(--accent)]/50 text-[10px]"></i><span class="text-primary">' + f + '</span>';
        li.addEventListener('click', function () {
          closeModal();
          setTimeout(function () {
            openTabByIndex(4);
            var subjectInput = document.getElementById('subject');
            if (subjectInput) {
              subjectInput.value = f;
              subjectInput.focus();
            }
          }, 350);
        });
      } else {
        li.className = 'flex items-start gap-2.5 text-xs text-muted max-md:text-[11px]';
        li.innerHTML = '<span class="text-[var(--accent)] mt-0.5 font-[\'JetBrains_Mono\'] text-[10px]">&#9656;</span><span>' + f + '</span>';
      }
      modalFeatures.appendChild(li);
    });

    modalTech.innerHTML = '';
    p.tech.forEach(function (t) {
      var span = document.createElement('span');
      span.className = 'text-[10px] px-2 py-0.5 rounded bg-[var(--accent)]/5 border border-[var(--accent)]/8 text-[var(--accent)]/60';
      span.textContent = t;
      modalTech.appendChild(span);
    });

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

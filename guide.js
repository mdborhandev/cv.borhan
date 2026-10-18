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
  var qaActions = document.getElementById('guide-qa-actions');
  var guideInput = document.getElementById('guide-input');
  var guideAskBtn = document.getElementById('guide-ask');
  var guideAnswer = document.getElementById('guide-answer');
  var guideClearBtn = document.getElementById('guide-clear');
  var guideSuggestBtn = document.getElementById('guide-suggest');
  var dismissButton = document.getElementById('guide-dismiss');
  var minimizeButton = document.getElementById('guide-minimize');
  var suggestionsBox = document.getElementById('guide-suggestions');
  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var isPopoverOpen = false;
  var speechTimer = null;
  var mouthTimer = null;
  var thinkingTimer = null;

  var DEFAULT_GREETING = "Hi! Ask me anything about Borhan — his skills, projects, experience, services, or how to get in touch.";
  var NOT_FOUND_ANSWERS = [
    "I'm not sure about that one. Try asking about his skills, projects, experience, services, or contact details.",
    "Could you rephrase that? I can answer about skills, projects, experience, services, or how to reach Borhan.",
    "Not quite sure. Try: 'What are your skills?', 'Show me projects', or 'How can I contact you?'",
    "I can help with Borhan's skills, projects, experience, services, or contact info. What would you like to know?"
  ];

  var KB = [
    {
      keywords: ['name', 'full name', 'who are you', 'who is he', 'borhan', 'fahim'],
      answer: "I'm Borhan Uddin Fahim — an ASP.NET Core & SaaS Backend Developer focused on building secure, scalable, production-ready systems."
    },
    {
      keywords: ['role', 'title', 'job', 'position', 'what do you do', 'backend developer'],
      answer: "I'm an ASP.NET Core & C# Backend Developer. I design and build reliable APIs, databases, multi-tenant architectures, and business logic that keeps products stable in production."
    },
    {
      keywords: ['about', 'bio', 'summary', 'overview', 'tell me about yourself', 'introduce'],
      answer: "I'm Borhan Uddin Fahim, a backend developer for hire with 3+ years of experience delivering secure, scalable SaaS and enterprise applications. I specialise in ASP.NET Core, C#, Entity Framework Core, Clean Architecture, and multi-tenant systems. I focus on building software that's reliable, maintainable, and delivered on schedule."
    },
    {
      keywords: ['available', 'hire', 'for hire', 'freelance', 'contract', 'remote', 'open to work', 'availability'],
      answer: "I'm available for new freelance, contract, and remote backend projects worldwide. If you have a SaaS, API, or enterprise backend to build or untangle, I'd be happy to discuss it."
    },
    {
      keywords: ['skills', 'tech', 'stack', 'technologies', 'tools', 'what do you use', 'expertise'],
      answer: "Core skills: ASP.NET Core, C#, Entity Framework Core, Web API, Clean Architecture, Domain-Driven Design, RESTful APIs, Authentication/Authorization (JWT, RBAC).\n\nDatabases: SQL Server, PostgreSQL, Database Design, Query Optimization, Migrations.\n\nArchitecture & Dev: Multi-Tenant SaaS, Modular Monoliths, Repository/Unit of Work, Validation, Logging, Background Jobs.\n\nFrontend/Other: HTML, CSS, JavaScript, Git, GitHub, Postman, Swagger, Vercel/Deployment workflows."
    },
    {
      keywords: ['languages', 'programming languages', 'c#', '.net', 'dotnet', 'asp.net', 'aspnet core'],
      answer: "Primary: C# and ASP.NET Core (.NET). I work with Entity Framework Core, LINQ, and follow Clean Architecture principles for maintainable backends."
    },
    {
      keywords: ['database', 'sql', 'postgres', 'postgresql', 'sql server', 'ef', 'ef core', 'optimization', 'performance'],
      answer: "I work with SQL Server and PostgreSQL, focusing on relational schema design, indexing, query optimisation, data integrity, and performance tuning for production workloads."
    },
    {
      keywords: ['architecture', 'clean architecture', 'ddd', 'domain driven', 'multi-tenant', 'multitenant', 'saas architecture', 'rbac', 'roles'],
      answer: "I build with Clean Architecture and Domain-Driven Design where it fits. Strong in multi-tenant SaaS (tenant isolation), granular RBAC, modular design, and keeping business logic separated from infrastructure."
    },
    {
      keywords: ['projects', 'work', 'portfolio', 'built', 'case studies', 'show me projects', 'what have you built'],
      answer: "Key projects:\n\n• Multi-Tenant HRM & Payroll System – Tenant isolation, automated payroll, attendance, leave, shifts, granular RBAC.\n\n• ERP & Accounting Platform – Modular ERP with accounting, inventory, approvals, reporting, and role-based access.\n\n• CRM & OKR Management – Lead tracking, pipelines, OKRs, goals, team workflows.\n\n• Enterprise Business Applications – Scalable APIs and admin panels with production-grade data models.\n\nWant details on any of these? Just say the project name."
    },
    {
      keywords: ['hrm', 'payroll', 'attendance', 'leave', 'human resource', 'hr'],
      answer: "HRM & Payroll project: Multi-tenant architecture with strict tenant isolation, automated payroll calculations, attendance & shift management, leave tracking, and granular role-based access control (RBAC)."
    },
    {
      keywords: ['erp', 'accounting', 'inventory', 'finance'],
      answer: "ERP & Accounting: Modular, multi-tenant ERP covering accounting, inventory, approvals, workflows, and reporting — built to keep data isolated and operations auditable."
    },
    {
      keywords: ['crm', 'okr', 'goals', 'pipeline', 'leads'],
      answer: "CRM & OKR: Lead/pipeline management with OKR goal tracking, team alignment, and clean data models for reporting and automation."
    },
    {
      keywords: ['experience', 'work experience', 'career', 'background', 'history'],
      answer: "Experience:\n\n• Junior Software Engineer – Focused on backend features, APIs, data models, bug fixes, and production-readiness.\n\n3+ years building secure, scalable SaaS and enterprise apps with ASP.NET Core & C#."
    },
    {
      keywords: ['services', 'what can you do', 'offer', 'offerings', 'service'],
      answer: "Services I offer:\n\n• SaaS Platform Development – Multi-tenant, auth, billing-ready foundations, scalable APIs.\n\n• Custom Enterprise Software – Internal tools, ERPs, HRMs, CRMs tailored to workflows.\n\n• REST API & Backend Development – Clean, documented APIs, business logic, integrations.\n\n• Database Design & Optimization – Schemas, indexing, migrations, query/perf tuning.\n\n• Full-Stack Web Applications – ASP.NET Core backend + maintainable frontend integration.\n\n• Dedicated Developer / Contract – Long-term, reliable backend work on retainer/contract."
    },
    {
      keywords: ['saas', 'saas platform', 'multi tenant saas'],
      answer: "SaaS Platform Development: I build multi-tenant SaaS with proper tenant isolation, RBAC, extensible modules, clean APIs, and a solid foundation for scaling and maintainability."
    },
    {
      keywords: ['bug fix', 'bug fixing', 'project rescue', 'rescue project', 'broken app', 'crash fix', 'memory leak', 'deadlock', 'security audit', 'vulnerability', 'tech debt', 'dotnet upgrade'],
      answer: "Bug Fixing & Project Rescue: Your developer left, the app is broken, or performance is tanking. I diagnose, stabilize, and ship fixes fast — crash fixes, memory leaks, deadlocks, slow query optimization, security audits, vulnerability patching, tech debt cleanup, and .NET upgrades."
    },
    {
      keywords: ['performance booster', 'performance boost', 'slow app', 'speed up', 'profiling', 'redis cache', 'n+1', 'load test', 'capacity planning', 'bottleneck'],
      answer: "Performance Booster for Your Existing Apps: Your app works but it's slow. I profile, cache, optimize queries, and tune the stack so it scales — profiling & bottleneck detection (dotTrace, PerfView), Redis caching & response compression, EF Core query optimization & N+1 fixes, load testing & capacity planning."
    },
    {
      keywords: ['api integration', 'webhook', 'stripe', 'bkash', 'nagad', 'sslcommerz', 'twilio', 'sendgrid', 'erp integration', 'crm integration', 'shipping api', 'payment gateway', 'idempotency'],
      answer: "API Integration & Webhooks: Connect your app to the services your business runs on — Stripe, PayPal, bKash, Nagad, SSLCommerz, Twilio/SMS, SendGrid/Email, push notifications, ERP, CRM, accounting & shipping APIs, with webhook receivers, retries, and idempotency."
    },
    {
      keywords: ['legacy migration', '.net framework', 'dotnet framework', 'migrate to .net 8', 'migrate to .net 9', 'monolith to modular', 'ef6 to ef core', 'webforms to razor', 'modernization', 'zero downtime migration'],
      answer: "Legacy .NET Migration & Modernization: Move from .NET Framework to .NET 8/9, monolith to modular, or upgrade outdated stacks safely — .NET Framework → .NET 8/9 migration, monolith → modular / clean architecture, EF6 → EF Core, WebForms → Razor/Pages, zero-downtime migration strategies."
    },
    {
      keywords: ['background job', 'background jobs', 'worker service', 'hangfire', 'quartz', 'masstransit', 'hosted service', 'scheduled job', 'cron job', 'recurring task', 'dead letter', 'distributed lock', 'idempotency'],
      answer: "Background Jobs & Worker Services: Reliable async processing — queues, scheduling, retries, and long-running tasks that don't block your API. Hangfire, Quartz, MassTransit, hosted services, job queues, retries, dead-letter handling, scheduled/cron jobs, distributed locking & idempotency."
    },
    {
      keywords: ['r&d', 'research and development', 'prototyping', 'prototype', 'mvp', 'feasibility study', 'spike', 'architecture decision', 'adr', 'new stack', 'dotnet aspire', 'dapr', 'tech evaluation'],
      answer: "Software R&D / Prototyping: Explore new tech, validate ideas, or build proof-of-concepts before committing to full development — technical feasibility studies & spikes, rapid prototypes & MVPs in weeks, architecture decision records (ADRs), new stack evaluation (e.g., .NET Aspire, Dapr)."
    },
    {
      keywords: ['api', 'apis', 'rest', 'rest api', 'web api', 'backend api', 'endpoint'],
      answer: "REST API & Backend Development: I build clean, versionable, well-structured Web APIs with proper validation, error handling, authentication, authorization, and Swagger/OpenAPI documentation."
    },
    {
      keywords: ['enterprise', 'custom software', 'internal tools'],
      answer: "Custom Enterprise Software: Tailored ERPs, HRMs, CRMs, and internal tools designed around your actual workflows — focusing on security, auditability, and maintainability."
    },
    {
      keywords: ['database design', 'tuning', 'optimize database'],
      answer: "Database Design & Optimization: Normalised schemas, strategic indexing, EF Core migrations, slow query analysis, and performance tuning to reduce load and keep things fast in production."
    },
    {
      keywords: ['full stack', 'full-stack', 'fullstack'],
      answer: "Full-Stack Web Applications: ASP.NET Core backend with clean API contracts, solid data layer, and pragmatic frontend integration to deliver end-to-end, maintainable features."
    },
    {
      keywords: ['dedicated', 'retainer', 'contractor', 'hire full time', 'long term'],
      answer: "Dedicated Developer / Contract: Reliable, long-term backend support. I focus on clear communication, predictable delivery, clean code, and treating your product like it's my own."
    },
    {
      keywords: ['contact', 'reach', 'email', 'mail', 'whatsapp', 'phone', 'get in touch', 'hire me', 'message'],
      answer: "Ways to reach Borhan:\n\n• Email: mdborhan.dev@gmail.com\n\n• WhatsApp: https://wa.me/8801906750597\n\n• Contact form on this portfolio (Contact tab).\n\nTell me about your project, timeline, and budget — I'll get back with a clear, honest breakdown."
    },
    {
      keywords: ['email address', 'gmail'],
      answer: "Email: mdborhan.dev@gmail.com"
    },
    {
      keywords: ['whatsapp', 'chat', 'message me'],
      answer: "WhatsApp: https://wa.me/8801906750597 — feel free to say hi with a quick project brief."
    },
    {
      keywords: ['location', 'based', 'country', 'bangladesh', 'timezone'],
      answer: "Based in Bangladesh, working globally as a remote freelance/contract backend developer (available worldwide)."
    },
    {
      keywords: ['education', 'degree', 'study', 'university', 'college'],
      answer: "Education info is on the Experience/Education section of this portfolio. Core focus has been practical software engineering and building production systems."
    },
    {
      keywords: ['cv', 'resume', 'resume pdf', 'cv download'],
      answer: "You can download his CV from the profile section on this portfolio (Download CV button)."
    },
    {
      keywords: ['timeline', 'years', 'experience years', 'how many years'],
      answer: "3+ years of professional experience building secure, scalable SaaS and enterprise applications with ASP.NET Core, C#, and SQL databases."
    },
    {
      keywords: ['quality', 'reliable', 'production', 'maintainable', 'clean code'],
      answer: "I focus on reliability first — clean, maintainable code, proper validation, error handling, tenant/data isolation, and production-readiness so systems keep running after launch."
    },
    {
      keywords: ['start project', 'consultation', 'quote', 'estimate', 'budget', 'timeline'],
      answer: "To get started: share your problem, core features, timeline, and rough budget via Email, WhatsApp, or the Contact form. I'll reply with a clear scope, suggested approach, and honest estimate — no pressure."
    },
    {
      keywords: ['thanks', 'thank you', 'ty', 'appreciate'],
      answer: "You're welcome! Feel free to ask anything else about Borhan's work or how to get started."
    },
    {
      keywords: ['hi', 'hello', 'hey', 'yo', 'greetings', 'good morning', 'good afternoon', 'good evening'],
      answer: "Hey there! 👋 Ask me about Borhan's skills, projects, experience, services, or how to reach him."
    },
    {
      keywords: ['bye', 'goodbye', 'see you', 'later'],
      answer: "Take care! If you need anything about Borhan later, just reopen me here."
    }
  ];

  var SUGGESTIONS = [
    'What are his skills?',
    'What projects has he built?',
    'What services does he offer?',
    'How can I contact him?',
    "What's his experience?",
    'Is he available for hire?',
    'Tell me about Bug Fixing & Project Rescue',
    'What is Performance Booster for apps?',
    'How does Legacy .NET Migration work?',
    'What are Background Jobs & Worker Services?',
    'Tell me about API Integration & Webhooks',
    'What is Software R&D / Prototyping?',
    'What databases does he use?',
    'How much does a project cost?',
    'Where is he based?'
  ];

  function clamp(value, min, max) {
    return Math.max(min, Math.min(value, max));
  }

  function setPopoverOpen(open) {
    isPopoverOpen = open;
    popover.setAttribute('aria-hidden', open ? 'false' : 'true');
    guide.setAttribute('data-open', open ? 'true' : 'false');
    character.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (open && guideInput) {
      window.setTimeout(function () {
        try { guideInput.focus(); } catch (e) {}
      }, 60);
    }
  }

  function animateSpeech() {
    if (!guideArt) return;
    guideArt.classList.remove('is-speaking');
    void guideArt.offsetWidth;
    guideArt.classList.add('is-speaking');
    window.clearTimeout(mouthTimer);
    mouthTimer = window.setTimeout(function () {
      if (guideArt) guideArt.classList.remove('is-speaking');
    }, 900);
  }

  function setSpeech(text) {
    if (!speech) return;
    window.clearTimeout(speechTimer);
    speech.classList.remove('is-changing');
    void speech.offsetWidth;
    speech.textContent = text || '';
    speech.classList.add('is-changing');
    animateSpeech();
  }

  function wave() {
    if (!character) return;
    character.classList.remove('is-waving');
    void character.offsetWidth;
    character.classList.add('is-waving');
    window.setTimeout(function () { if (character) character.classList.remove('is-waving'); }, 1260);
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

  function resetGaze() {
    if (pupils) {
      pupils.style.setProperty('--gaze-x', '0px');
      pupils.style.setProperty('--gaze-y', '0px');
    }
  }

  function setBubblePosition() {
    var box = popover.getBoundingClientRect();
    var width = box.width || 306;
    var height = box.height || 150;
    var charRect = character.getBoundingClientRect();
    var x = charRect.left;
    var y = charRect.top;

    var bubbleX = clamp(x - width - 16, 10, window.innerWidth - width - 10);
    if (window.innerWidth < 560 && bubbleX < 12) {
      bubbleX = clamp(x + 90, 10, window.innerWidth - width - 10);
    }
    var preferredY = y - height - 18;
    var topLimit = 76;
    var bottomLimit = window.innerHeight - height - (window.innerWidth < 1024 ? 100 : 16);
    var bubbleY = clamp(preferredY, topLimit, Math.max(topLimit, bottomLimit));

    guide.style.setProperty('--bubble-x', Math.round(bubbleX) + 'px');
    guide.style.setProperty('--bubble-y', Math.round(bubbleY) + 'px');
  }

  function normalize(text) {
    if (!text) return '';
    return text
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s]/gu, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function findAnswer(q) {
    var norm = normalize(q);
    if (!norm) return null;

    var best = { score: 0, answer: null };

    for (var i = 0; i < KB.length; i++) {
      var item = KB[i];
      var score = 0;
      for (var j = 0; j < item.keywords.length; j++) {
        var kw = item.keywords[j];
        if (!kw) continue;
        var k = kw.toLowerCase();
        if (norm === k) {
          score += 3;
        } else if (k.indexOf(' ') === -1 && norm.split(' ').indexOf(k) !== -1) {
          score += 2;
        } else if (norm.indexOf(k) !== -1) {
          score += 1.2;
        }
      }
      if (score > best.score) {
        best.score = score;
        best.answer = item.answer;
      }
      if (best.score >= 3) break;
    }

    if (best.score >= 0.9 && best.answer) return best.answer;
    return null;
  }

  function suggestTab(text) {
    text = text.toLowerCase();
    if (text.includes('skill') || text.includes('tech') || text.includes('stack') || text.includes('tool') || text.includes('language') || text.includes('expertise') || text.includes('service') || text.includes('offer') || text.includes('pricing') || text.includes('consult') || text.includes('dedicated') || text.includes('retainer')) {
      return { tab: 1, label: 'See the Skills & Services section →' };
    }
    if (text.includes('experience') || text.includes('work') || text.includes('career') || text.includes('background') || text.includes('timeline') || text.includes('year') || text.includes('years') || text.includes('education') || text.includes('job') || text.includes('role') || text.includes('company') || text.includes('intern') || text.includes('junior')) {
      return { tab: 3, label: 'See the Experience section →' };
    }
    if (text.includes('project') || text.includes('case') || text.includes('built') || text.includes('hrm') || text.includes('erp') || text.includes('crm') || text.includes('okr')) {
      return { tab: 2, label: 'See the Projects section →' };
    }
    if (text.includes('contact') || text.includes('email') || text.includes('whatsapp') || text.includes('hire') || text.includes('reach') || text.includes('get in touch') || text.includes('message')) {
      return { tab: 4, label: 'Go to Contact →' };
    }
    if (text.includes('about') || text.includes('bio') || text.includes('who') || text.includes('name') || text.includes('introduce') || text.includes('summary') || text.includes('available') || text.includes('freelance')) {
      return { tab: 0, label: 'See the About section →' };
    }
    return null;
  }

  function tryAutoNavigate(ans, q) {
    if (typeof window.openTabByIndex !== 'function') return;
    var pick = suggestTab((ans + ' ' + q).toLowerCase());
    if (pick) window.openTabByIndex(pick.tab);
  }

  function getRandomFallback() {
    var idx = Math.floor(Math.random() * NOT_FOUND_ANSWERS.length);
    return NOT_FOUND_ANSWERS[idx];
  }

  function showThinking() {
    window.clearTimeout(thinkingTimer);
    setSpeech('Hmm, let me think...');
    animateSpeech();
    if (guideAnswer) guideAnswer.hidden = true;
    if (guideClearBtn) guideClearBtn.hidden = true;
    if (guideSuggestBtn) guideSuggestBtn.hidden = true;
    thinkingTimer = window.setTimeout(function () {
    }, 250);
  }

  function hideThinking() {
    window.clearTimeout(thinkingTimer);
  }

  var lastSuggestions = [];

  function pickSuggestions() {
    var pool = SUGGESTIONS.slice();
    var picks = [];
    // Prefer questions the guide can actually answer well.
    while (picks.length < 3 && pool.length) {
      var idx = Math.floor(Math.random() * pool.length);
      var choice = pool.splice(idx, 1)[0];
      if (lastSuggestions.indexOf(choice) === -1 || pool.length === 0) picks.push(choice);
    }
    lastSuggestions = picks;
    return picks;
  }

  function renderSuggestions() {
    if (!suggestionsBox) return;
    suggestionsBox.textContent = '';
    var picks = pickSuggestions();
    for (var i = 0; i < picks.length; i++) {
      (function (question) {
        var chip = document.createElement('button');
        chip.type = 'button';
        chip.className = 'guide-chip';
        chip.textContent = question;
        chip.addEventListener('click', function () {
          if (guideInput) guideInput.value = question;
          askQuestion();
        });
        suggestionsBox.appendChild(chip);
      })(picks[i]);
    }
    suggestionsBox.hidden = false;
  }

  function askQuestion() {
    var q = guideInput ? guideInput.value : '';
    if (!q || !q.trim()) {
      setSpeech('Type a question first — e.g. "What are your skills?"');
      if (guideAnswer) guideAnswer.hidden = true;
      if (guideClearBtn) guideClearBtn.hidden = true;
      if (guideSuggestBtn) guideSuggestBtn.hidden = true;
      wave();
      if (guideInput) guideInput.focus();
      return;
    }

    showThinking();

    window.setTimeout(function () {
      hideThinking();
      var ans = findAnswer(q);
      if (!ans) ans = getRandomFallback();

      // Don't repeat answer in speech bubble; show only full answer below input
      setSpeech('');
      if (guideAnswer) {
        var cleanAns = ans.replace(/^\s*\n+/, '').replace(/\n\s*\n\s*\n+/g, '\n\n').trim();
        guideAnswer.textContent = cleanAns;
        guideAnswer.hidden = false;
      }
      if (guideClearBtn) guideClearBtn.hidden = false;
      // Suggestion button based on the topic
      var ql = q.toLowerCase();
      var combined = (ans + ' ' + ql).toLowerCase();
      var pick = suggestTab(ql);
      if (!pick) pick = suggestTab(combined); // prefer user question first, then answer+question
      if (!pick) {
        if (ql.indexOf('exp') !== -1) pick = { tab: 3, label: 'See the Experience section →' };
      }
      if (guideSuggestBtn && pick) {
        guideSuggestBtn.textContent = pick.label;
        guideSuggestBtn.setAttribute('data-tab', String(pick.tab));
        guideSuggestBtn.removeAttribute('hidden');
        guideSuggestBtn.hidden = false;
        guideSuggestBtn.style.display = 'block';
      } else if (guideSuggestBtn) {
        guideSuggestBtn.setAttribute('hidden', '');
        guideSuggestBtn.hidden = true;
        guideSuggestBtn.style.display = 'none';
      }
      wave();
      renderSuggestions();
      setBubblePosition();

    }, reducedMotion ? 80 : 320);
  }

  function clearAnswer() {
    if (guideAnswer) {
      guideAnswer.hidden = true;
      guideAnswer.textContent = '';
    }
    if (guideClearBtn) guideClearBtn.hidden = true;
    if (guideSuggestBtn) guideSuggestBtn.hidden = true;
    setSpeech(DEFAULT_GREETING);
    renderSuggestions();
    if (guideInput) {
      guideInput.value = '';
      guideInput.focus();
    }
    resetGaze();
    setBubblePosition();
  }

  function closePopover() {
    isPopoverOpen = false;
    setPopoverOpen(false);
    resetGaze();
    character.focus();
  }

  var isMinimized = true;

  function setMinimized(minimized) {
    isMinimized = minimized;
    guide.setAttribute('data-minimized', minimized ? 'true' : 'false');
    if (minimized) {
      closePopover();
      character.setAttribute('aria-label', 'Restore Borhan’s asking guide');
      try { sessionStorage.setItem('portfolioGuideMinimized', 'true'); } catch (e) {}
    } else {
      character.setAttribute('aria-label', 'Open Borhan’s asking guide');
      try { sessionStorage.setItem('portfolioGuideMinimized', 'false'); } catch (e) {}
    }
  }

  try {
    // Default to minimized. Only expand if user explicitly un-minimized before.
    if (sessionStorage.getItem('portfolioGuideMinimized') === 'false') {
      setMinimized(false);
    } else {
      setMinimized(true); // Ensure aria-label and attributes are set correctly
    }
  } catch (e) {}

  if (minimizeButton) minimizeButton.addEventListener('click', function () {
    setMinimized(true);
  });

  character.addEventListener('click', function () {
    if (isMinimized) {
      setMinimized(false);
    }
    if (!isPopoverOpen) {
      setSpeech(DEFAULT_GREETING);
      if (guideAnswer) guideAnswer.hidden = true;
      if (guideClearBtn) guideClearBtn.hidden = true;
      if (guideSuggestBtn) guideSuggestBtn.hidden = true;
      if (guideInput) guideInput.value = '';
      setPopoverOpen(true);
      wave();
      renderSuggestions();
      setBubblePosition();
    } else {
      closePopover();
    }
  });

  if (guideAskBtn) guideAskBtn.addEventListener('click', askQuestion);
  if (guideInput) {
    guideInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        askQuestion();
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        closePopover();
      }
    });
  }
  if (guideClearBtn) guideClearBtn.addEventListener('click', clearAnswer);
  if (guideSuggestBtn) guideSuggestBtn.addEventListener('click', function () {
    var tab = parseInt(guideSuggestBtn.getAttribute('data-tab'), 10);
    if (!isNaN(tab) && typeof window.openTabByIndex === 'function') window.openTabByIndex(tab);
    // Close guide after showing the section
    window.setTimeout(function () { closePopover(); }, 180);
  });
  if (dismissButton) dismissButton.addEventListener('click', closePopover);

  document.addEventListener('keydown', function (event) {
    if (event.key !== 'Escape' || !isPopoverOpen) return;
    var projectModal = document.getElementById('project-modal');
    if (projectModal && !projectModal.classList.contains('hidden')) return;
    closePopover();
  });

  document.addEventListener('click', function (event) {
    if (guide.contains(event.target)) return;
    if (event.target.closest('.tab-btn')) {
      if (isPopoverOpen) {
        var active = document.querySelector('.tab-content[data-tab-active="true"]');
        var name = active ? active.getAttribute('data-tab-name') : '';
        var lines = {
          about: 'Ask me about Borhan, skills, or availability.',
          skills: 'Want to know his tech stack or strongest areas?',
          projects: 'Ask me about any project — HRM, ERP, CRM, or OKR.',
          experience: 'Ask about his work experience or timeline.',
          contact: 'Ask how to reach Borhan or start a project.',
          services: 'Ask what services he offers or pricing approach.'
        };
        setSpeech(lines[name] || 'Go ahead, ask me anything about Borhan.');
        wave();
      }
      return;
    }
    if (event.target.closest('.project-card')) {
      if (isPopoverOpen) {
        setSpeech('Ask me about this project or any other one he built.');
        wave();
      }
      return;
    }
    if (event.target.closest('.btn-primary:not(#submit-btn)')) {
      if (isPopoverOpen) {
        setSpeech('Want to start a project? Ask me for details or how to reach him.');
        wave();
      }
    }
  });

  var alreadyDismissed = false;
  try { alreadyDismissed = sessionStorage.getItem('portfolioGuideDismissed') === 'true'; } catch (e) {}

  function rememberDismissal() {
    alreadyDismissed = true;
    try { sessionStorage.setItem('portfolioGuideDismissed', 'true'); } catch (e) {}
  }
  if (dismissButton) dismissButton.addEventListener('click', rememberDismissal);

  window.addEventListener('resize', function () {
    if (isPopoverOpen) setBubblePosition();
  });

  window.setTimeout(function () {
    guide.setAttribute('data-visible', 'true');
    guide.removeAttribute('aria-hidden');
    setBubblePosition();
    if (!alreadyDismissed && !isMinimized) {
      window.setTimeout(function () {
        if (!alreadyDismissed && !isMinimized && !isPopoverOpen) {
          setSpeech(DEFAULT_GREETING);
          setPopoverOpen(true);
          wave();
          renderSuggestions();
          setBubblePosition();
        }
      }, 520);
    }
  }, 1700);
})();

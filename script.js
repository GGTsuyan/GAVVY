// GAVVY - Dark Luxury Couple App
const GAVVY = (() => {
  let state = {
    couple: { name1: 'Gab', name2: 'Avi', startDate: null },
    memories: [],
    notes: [],
    events: [],
    goals: [
      { id: '1', emoji: '✈️', title: 'Japan 2027', type: 'savings', progress: 32500, target: 50000, deadline: '2027-12-31', milestones: [{ value: 10000, label: '₱10k', reward: '🎯 Dreamer' }, { value: 20000, label: '₱20k', reward: '🎯 Planner' }, { value: 30000, label: '₱30k', reward: '🏅 Saver' }, { value: 40000, label: '₱40k', reward: '🏅 Go-Getter' }, { value: 50000, label: '₱50k', reward: '🏆 Travel Legends' }], createdAt: '2026-01-15' },
      { id: '2', emoji: '🎬', title: 'Movie Challenge', type: 'count', progress: 67, target: 100, milestones: [{ value: 25, label: '25 Movies', reward: '🏅 Cinephile I' }, { value: 50, label: '50 Movies', reward: '🏅 Cinephile II' }, { value: 75, label: '75 Movies', reward: '🏅 Movie Master' }, { value: 100, label: '100 Movies', reward: '🏆 Movie Legends' }], items: [{ id: '1', name: 'Interstellar', completed: true, date: '2026-02-14' }, { id: '2', name: 'La La Land', completed: true, date: '2026-03-01' }, { id: '3', name: 'Her', completed: true, date: '2026-03-15' }], createdAt: '2026-01-01' }
    ],
    lists: { dateIdeas: [], travelList: [], movies: [], restaurants: [], giftIdeas: [] },
    trips: [],
    periodTracker: { entries: [], lastPeriodDate: null, averageLength: 36, periodLength: 6 },
    auth: { currentUser: null, token: null },
    questions: [
      'What place would you like to visit together?',
      'What\'s a favorite memory we share?',
      'What\'s something you love about me?',
      'Where do you see us in 5 years?',
      'What should we do next weekend?'
    ],
    currentQuestion: 0,
    answeredQuestions: [],
    mood: { current: {}, customMoods: ['😊 Happy', '😌 Relaxed', '😴 Tired', '😔 Sad', '🤩 Excited'], selectedPerson: 'Gab', updatedAt: new Date().toISOString() },
    surprise: {
      Gab: { preview: 'Message locked until June 15, 2026 · 8:00 PM', message: 'Every day with you feels like the most beautiful adventure.', unlockDate: '2026-06-15T20:00:00' },
      Avi: { preview: 'Message locked until June 15, 2026 · 8:00 PM', message: 'Every day with you feels like the most beautiful adventure.', unlockDate: '2026-06-15T20:00:00' }
    }
  };

  const API_BASE = '/api';
  let currentRoute = 'home';
  let cloudLoaded = false;

  async function save() {
    localStorage.setItem('gavvy-state', JSON.stringify(state));
    if (window._supabaseReady && window.saveToSupabase) {
      try { await window.saveToSupabase(state); } catch(e) { console.warn('Supabase save failed:', e); }
    }
  }
  
  function load() {
    try {
      const s = localStorage.getItem('gavvy-state');
      if (s) {
        const parsed = JSON.parse(s);
        // Only merge, don't overwrite with defaults
        for (const key of Object.keys(parsed)) {
          if (key === 'goals') {
            // Merge goals, keeping any new ones from defaults
            const existingIds = state.goals.map(g => g.id);
            parsed.goals.forEach(g => {
              if (!existingIds.includes(g.id)) state.goals.push(g);
            });
          } else if (key === 'periodTracker') {
            // Deep merge period tracker
            if (parsed.periodTracker) {
              state.periodTracker.lastPeriodDate = parsed.periodTracker.lastPeriodDate || state.periodTracker.lastPeriodDate;
              state.periodTracker.averageLength = parsed.periodTracker.averageLength || state.periodTracker.averageLength;
              state.periodTracker.periodLength = parsed.periodTracker.periodLength || state.periodTracker.periodLength;
              if (parsed.periodTracker.entries && parsed.periodTracker.entries.length) {
                state.periodTracker.entries = parsed.periodTracker.entries;
              }
            }
          } else {
            state[key] = parsed[key];
          }
        }
      }
    } catch (e) { console.warn('Load error:', e); }
  }
  
  async function loadFromCloud() {
    if (window._supabaseReady && window.loadFromSupabase) {
      try {
        const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000));
        const loadOp = window.loadFromSupabase(state);
        const loaded = await Promise.race([loadOp, timeout]);
        // Cache back to localStorage
        localStorage.setItem('gavvy-state', JSON.stringify(state));
        cloudLoaded = true;
        console.log('Cloud data loaded successfully!');
        // Re-navigate to refresh UI with cloud data
        if (currentRoute && currentRoute !== 'login') navigate(currentRoute);
      } catch(e) { console.warn('Supabase load failed:', e); }
    }
  }

  function closeModalAndRefresh() {
    const modal = document.getElementById('memoryModal');
    if (modal && modal.parentElement) {
      modal.parentElement.classList.remove('active');
    }
    setTimeout(() => {
      if (currentRoute && currentRoute !== 'login') {
        navigate(currentRoute);
      }
    }, 150);
  }

  async function postJson(path, body) {
    const response = await fetch(API_BASE + path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    return response.json();
  }

  async function uploadPhoto(file) {
    if (!file) return null;
    const form = new FormData();
    form.append('photo', file);
    const response = await fetch(API_BASE + '/upload-photo', { method: 'POST', body: form });
    if (!response.ok) return null;
    const data = await response.json();
    return data.url || null;
  }

  async function loginRequest(username, password) {
    return postJson('/login', { username, password });
  }

  async function signupRequest(username, password) {
    return postJson('/signup', { username, password });
  }

  // LOAD SEQUENCE:
  // 1. Load cached data from localStorage (instant, synchronous)
  load();
  
  // 2. Apply defaults for any missing fields (without overwriting loaded data)
  if (!state.couple.startDate) state.couple.startDate = '2025-07-09';
  state.couple.name1 = state.couple.name1 || 'Gab';
  state.couple.name2 = state.couple.name2 || 'Avi';
  if (state.couple.name1 === 'You') state.couple.name1 = 'Gab';
  if (state.couple.name2 === 'Partner') state.couple.name2 = 'Avi';
  if (!state.mood.current || Object.keys(state.mood.current).length === 0) {
    state.mood.current = {
      [state.couple.name1]: state.mood.you || '😊 Happy',
      [state.couple.name2]: state.mood.partner || '😊 Happy'
    };
  }
  state.mood.customMoods = state.mood.customMoods || ['😊 Happy', '😌 Relaxed', '😴 Tired', '😔 Sad', '🤩 Excited'];
  state.mood.selectedPerson = state.mood.selectedPerson || state.couple.name1;
  state.goals = state.goals.filter(g => g && g.id && g.emoji && g.title && g.type !== undefined && g.progress !== undefined && g.target !== undefined);
  // Save only to localStorage (not cloud) to preserve existing cloud state
  try { localStorage.setItem('gavvy-state', JSON.stringify(state)); } catch(e) {}
  
  // 3. Load cloud data from Supabase (async) - overwrites localStorage data with truth
  loadFromCloud();


  function el(tag, cls, html) { const e = document.createElement(tag); if (cls) e.className = cls; if (html !== undefined) e.innerHTML = html; return e; }

  function getDaysTogether() {
    if (!state.couple.startDate) return { years: 0, months: 0, days: 0, total: 0 };
    const start = new Date(state.couple.startDate);
    const now = new Date();
    let years = now.getFullYear() - start.getFullYear();
    let months = now.getMonth() - start.getMonth();
    let days = now.getDate() - start.getDate();
    if (days < 0) { months--; days += new Date(now.getFullYear(), now.getMonth(), 0).getDate(); }
    if (months < 0) { years--; months += 12; }
    return { years, months, days, total: Math.floor((now - start) / 86400000) };
  }

  function getCountdown(date) {
    if (!date) return null;
    const target = new Date(date);
    const now = new Date();
    const diff = Math.ceil((target - now) / 86400000);
    return diff > 0 ? diff : 0;
  }

  function showGoalDetail(goal) {
    const modal = document.getElementById('memoryModal');
    if (!modal) return;
    const pct = Math.round((goal.progress / goal.target) * 100);
    const nextMilestone = goal.milestones?.find(m => m.value > goal.progress);
    
    let detailHTML = `
      <div class="modal-content">
        <button class="modal-close" id="closeModal">✕</button>
        <div style="text-align:center;margin-bottom:16px">
          <div style="font-size:2.5rem;margin-bottom:8px">${goal.emoji}</div>
          <h2 style="margin:0;margin-bottom:8px">${goal.title}</h2>
          <div class="note-meta">${goal.type === 'savings' ? `₱${goal.progress.toLocaleString()} / ₱${goal.target.toLocaleString()}` : `${goal.progress} / ${goal.target}`}</div>
        </div>
        <div class="progress-bar" style="height:8px;background:rgba(255,255,255,0.1);border-radius:4px;overflow:hidden;margin-bottom:8px">
          <div class="progress-fill" style="width:${pct}%;height:100%;background:linear-gradient(90deg, #d4af37, #f4d03f)"></div>
        </div>
        <div style="text-align:center;color:var(--secondary);margin-bottom:16px;font-size:1.2rem;font-weight:600">${pct}% Complete</div>
    `;

    if (goal.type === 'savings') {
      detailHTML += `
        <div style="margin-bottom:16px;padding:16px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.1);border-radius:12px">
          <div class="label" style="margin-bottom:12px">Add Savings</div>
          <div style="display:flex;gap:8px">
            <input id="goalAddAmount" type="number" placeholder="Amount (₱)" style="flex:1;padding:10px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:8px;color:var(--text)">
            <button id="goalSaveBtn" class="btn btn-small">Add</button>
          </div>
        </div>
      `;
    } else if (goal.type === 'count') {
      detailHTML += `
        <div style="margin-bottom:16px;padding:16px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.1);border-radius:12px">
          <div class="label" style="margin-bottom:12px">Update Count</div>
          <div style="display:flex;gap:8px;align-items:center;justify-content:center">
            <button id="goalDecrementBtn" class="btn btn-small" style="flex:0 0 50px">−</button>
            <div style="flex:1;text-align:center;font-size:1.5rem;font-weight:600">${goal.progress}</div>
            <button id="goalIncrementBtn" class="btn btn-small" style="flex:0 0 50px">+</button>
          </div>
        </div>
      `;
    } else if (goal.type === 'list') {
      const completed = goal.items?.filter(i => i.completed).length || 0;
      detailHTML += `
        <div style="margin-bottom:16px;padding:16px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.1);border-radius:12px">
          <div class="label" style="margin-bottom:12px">Add Item (${completed}/${goal.items?.length || 0})</div>
          <div style="display:flex;gap:8px">
            <input id="goalListItem" type="text" placeholder="Item name" style="flex:1;padding:10px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:8px;color:var(--text)">
            <button id="goalListAddBtn" class="btn btn-small">Add</button>
          </div>
        </div>
      `;
    }

    if (goal.milestones && goal.milestones.length > 0) {
      detailHTML += `
        <div style="margin-bottom:16px">
          <div class="label" style="margin-bottom:12px">Milestones</div>
          <div style="display:grid;gap:8px">
            ${goal.milestones.map(m => `
              <div style="display:flex;align-items:center;justify-content:space-between;padding:10px;background:rgba(255,255,255,0.05);border-radius:8px;border:1px solid ${m.value <= goal.progress ? 'rgba(212, 175, 55, 0.3)' : 'rgba(255,255,255,0.1)'}">
                <span>${m.label}</span>
                <span>${m.value <= goal.progress ? '✓ ' + m.reward : m.reward}</span>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }

    if (goal.items && goal.items.length > 0) {
      const completed = goal.items.filter(i => i.completed).length;
      detailHTML += `
        <div style="margin-bottom:16px">
          <div class="label" style="margin-bottom:12px">Items (${completed}/${goal.items.length})</div>
          <div style="display:grid;gap:6px;max-height:200px;overflow-y:auto">
            ${goal.items.map((item, idx) => `
              <div style="display:flex;align-items:center;gap:8px;padding:8px;border-bottom:1px solid rgba(255,255,255,0.05)" data-item-id="${item.id}">
                <input type="checkbox" ${item.completed ? 'checked' : ''} data-idx="${idx}" style="cursor:pointer;accent-color:var(--accent)">
                <span style="flex:1;${item.completed ? 'opacity:0.6;text-decoration:line-through' : ''}">${item.name}</span>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }

    detailHTML += `</div>`;
    modal.innerHTML = detailHTML;
    document.getElementById('memoryModal').parentElement.classList.add('active');
    document.getElementById('closeModal').onclick = () => document.getElementById('memoryModal').parentElement.classList.remove('active');

    setTimeout(() => {
      if (goal.type === 'savings') {
        const addBtn = document.getElementById('goalSaveBtn');
        const amountInput = document.getElementById('goalAddAmount');
        if (addBtn && amountInput) {
          addBtn.onclick = () => {
            const amount = parseInt(amountInput.value, 10);
            if (amount && amount > 0) {
              goal.progress += amount;
              if (goal.progress > goal.target) goal.progress = goal.target;
              save();
              closeModalAndRefresh();
            }
          };
        }
      } else if (goal.type === 'count') {
        const incBtn = document.getElementById('goalIncrementBtn');
        const decBtn = document.getElementById('goalDecrementBtn');
        if (incBtn) incBtn.onclick = () => { if (goal.progress < goal.target) { goal.progress++; save(); closeModalAndRefresh(); } };
        if (decBtn) decBtn.onclick = () => { if (goal.progress > 0) { goal.progress--; save(); closeModalAndRefresh(); } };
      } else if (goal.type === 'list') {
        const listAddBtn = document.getElementById('goalListAddBtn');
        const listInput = document.getElementById('goalListItem');
        if (listAddBtn && listInput) {
          listAddBtn.onclick = () => {
            const itemName = listInput.value.trim();
            if (itemName) {
              goal.items = goal.items || [];
              goal.items.push({ id: Date.now().toString(), name: itemName, completed: false, date: new Date().toISOString() });
              goal.progress = goal.items.filter(i => i.completed).length;
              save();
              closeModalAndRefresh();
            }
          };
        }
        const itemCheckboxes = document.querySelectorAll('input[data-idx]');
        itemCheckboxes.forEach(cb => {
          cb.onchange = () => {
            const idx = parseInt(cb.dataset.idx, 10);
            if (goal.items && goal.items[idx]) {
              goal.items[idx].completed = cb.checked;
              goal.progress = goal.items.filter(i => i.completed).length;
              save();
              closeModalAndRefresh();
            }
          };
        });
      }
    }, 50);
  }

  function showMemoryDetail(memory) {
    const modal = document.getElementById('memoryModal');
    if (!modal) return;
    modal.innerHTML = `
      <div class="modal-content">
        <button class="modal-close" id="closeModal">✕</button>
        ${memory.image ? `<div style="margin-bottom:18px;border-radius:20px;overflow:hidden"><img src="${memory.image}" alt="${memory.title}" style="width:100%;display:block"></div>` : `<div style="font-size:3rem;text-align:center;margin-bottom:16px">${memory.emoji || '📸'}</div>`}
        <h2 style="text-align:center;margin-bottom:8px">${memory.title}</h2>
        <div class="note-meta" style="text-align:center;margin-bottom:16px">${memory.date}</div>
        ${memory.location ? `<div class="muted" style="margin-bottom:12px">📍 ${memory.location}</div>` : ''}
        <div style="margin-bottom:20px;padding:16px;background:var(--bg-0);border-radius:12px;border:1px solid var(--border)">
          ${memory.story || memory.text || 'No description'}
        </div>
        <div style="display:flex;gap:8px;justify-content:center;margin-top:16px">
          <button class="emoji-btn" style="font-size:1.5rem">❤️</button>
          <button class="emoji-btn" style="font-size:1.5rem">😍</button>
          <button class="emoji-btn" style="font-size:1.5rem">🔥</button>
        </div>
      `;
    document.getElementById('memoryModal').parentElement.classList.add('active');
    document.getElementById('closeModal').onclick = () => document.getElementById('memoryModal').parentElement.classList.remove('active');
  }

  function showDateEventModal(dateStr) {
    const modal = document.getElementById('memoryModal');
    if (!modal) return;
    const eventsOnDate = state.events.filter(e => e.date === dateStr);
    const dateObj = new Date(dateStr + 'T00:00:00');
    const dateDisplay = dateObj.toLocaleDateString('default', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    
    modal.innerHTML = `
      <div class="modal-content">
        <button class="modal-close" id="closeDateModal">✕</button>
        <h3 style="margin-bottom:16px">${dateDisplay}</h3>
        <div id="eventsListModal" style="margin-bottom:20px;max-height:200px;overflow-y:auto">
          ${eventsOnDate.length === 0 ? '<div class="muted">No events on this date</div>' : eventsOnDate.map(e => `
            <div style="padding:12px;background:rgba(212,175,55,0.05);border-radius:8px;margin-bottom:8px;display:flex;justify-content:space-between;align-items:center">
              <div><span style="font-size:1.2rem">${e.emoji || '●'}</span> <strong>${e.title}</strong></div>
              <button class="delete-event-modal" data-event-date="${e.date}" data-event-title="${e.title}" style="background:none;border:none;color:var(--accent);cursor:pointer;font-size:1.1rem">×</button>
            </div>
          `).join('')}
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <input id="modalEventEmoji" placeholder="🍽️" value="🍽️" style="width:50px;text-align:center;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:8px;padding:10px;color:var(--text)">
          <input id="modalEventTitle" placeholder="Event title" style="flex:1;min-width:150px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:8px;padding:10px;color:var(--text)">
          <button id="addEventFromModal" class="btn">Add</button>
        </div>
      </div>
    `;
    
    document.getElementById('memoryModal').parentElement.classList.add('active');
    document.getElementById('closeDateModal').onclick = () => document.getElementById('memoryModal').parentElement.classList.remove('active');
    
    setTimeout(() => {
      const addBtn = document.getElementById('addEventFromModal');
      if (addBtn) {
        addBtn.onclick = () => {
          const emoji = document.getElementById('modalEventEmoji').value || '●';
          const title = document.getElementById('modalEventTitle').value.trim();
          if (!title) return;
          state.events.push({ emoji, date: dateStr, title });
          save();
          closeModalAndRefresh();
        };
      }
      
      document.querySelectorAll('.delete-event-modal').forEach(btn => {
        btn.onclick = (e) => {
          e.stopPropagation();
          const eventDate = btn.dataset.eventDate;
          const eventTitle = btn.dataset.eventTitle;
          if (confirm(`Delete "${eventTitle}"?`)) {
            state.events = state.events.filter(evt => !(evt.date === eventDate && evt.title === eventTitle));
            save();
            showDateEventModal(dateStr);
          }
        };
      });
    }, 10);
  }

  function renderHome() {
    const root = el('div');
    const days = getDaysTogether();

    const banner = el('div', 'couple-banner');
    banner.innerHTML = `
      <div class="couple-photo"></div>
      <div class="couple-banner-body">
        <div class="couple-names">${state.couple.name1} <span class="heart">🖤</span> ${state.couple.name2}</div>
        <div class="label" style="margin-top:8px">Together for</div>
        <div class="days-summary">${days.years} Year${days.years !== 1 ? 's' : ''} ${days.months} Month${days.months !== 1 ? 's' : ''} ${days.days} Day${days.days !== 1 ? 's' : ''}</div>
      </div>
    `;
    root.appendChild(banner);

    const startDateCard = el('div', 'card');
    startDateCard.style.marginTop = '24px';
    startDateCard.innerHTML = `
      <div class="label">Relationship Start Date</div>
      <input type="date" id="setStart" value="${state.couple.startDate}" style="margin-top:16px;width:100%;" disabled>
    `;
    root.appendChild(startDateCard);

    const questionCard = el('div', 'question-card');
    questionCard.style.marginTop = '24px';
    questionCard.innerHTML = `
      <div class="question-label">Today's Question</div>
      <div class="question-text">"${state.questions[state.currentQuestion % state.questions.length]}"</div>
      <button class="question-btn" id="answerBtn">Answer</button>
    `;
    root.appendChild(questionCard);

    const moodCard = el('div', 'card mood-card');
    moodCard.style.marginTop = '24px';
    moodCard.innerHTML = `
      <div class="label">Mood Check-In</div>
      <div class="mood-grid">
        ${state.mood.customMoods.map(m => `<button class="mood-option" data-mood="${m}">${m}</button>`).join('')}
      </div>
      <div class="mood-status">
        <div><strong>${state.couple.name1}:</strong> ${state.mood.current[state.couple.name1] || 'Not set'}</div>
        <div><strong>${state.couple.name2}:</strong> ${state.mood.current[state.couple.name2] || 'Not set'}</div>
        <div class="note-meta">Updated ${state.mood.updatedAt ? new Date(state.mood.updatedAt).toLocaleString() : 'never'}</div>
      </div>
    `;
    root.appendChild(moodCard);

    const summaryRow = el('div', 'grid');
    summaryRow.style.marginTop = '24px';
    const nextEvent = state.events.filter(e => new Date(e.date) >= new Date()).sort((a, b) => new Date(a.date) - new Date(b.date))[0];
    const countdown = el('div', 'col-12');
    countdown.appendChild(el('div', 'countdown-widget', `
      <div class="countdown-header">Next Date</div>
      <div class="countdown-title">${nextEvent ? `${nextEvent.emoji || '🍽️'} ${nextEvent.title}` : 'Plan your next date'}</div>
      <div class="countdown-time">${nextEvent ? `${getCountdown(nextEvent.date)} days left` : 'No date planned'}</div>
    `));
    summaryRow.appendChild(countdown);

    const goalsGrid = el('div', 'col-12');
    goalsGrid.appendChild(el('div', 'card', `
      <div class="label">Active Goals</div>
      <div id="homeGoalsContainer" style="display:grid;gap:14px;margin-top:16px">
        ${state.goals.length === 0 ? '<div class="muted" style="padding:20px;text-align:center">No goals yet. Add one in Us.</div>' : state.goals.map(g => {
          const pct = Math.round((g.progress / g.target) * 100);
          const nextMilestone = g.milestones?.find(m => m.value > g.progress);
          return `
            <div class="goal-card-home" data-goal-id="${g.id}" style="cursor:pointer">
              <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:8px">
                <div><span style="font-size:1.5rem">${g.emoji}</span> <strong>${g.title}</strong></div>
                <div style="font-size:0.8rem;color:var(--secondary)">${pct}%</div>
              </div>
              <div style="color:var(--secondary);font-size:0.9rem;margin-bottom:8px">
                ${g.type === 'savings' ? `₱${g.progress.toLocaleString()} / ₱${g.target.toLocaleString()}` : `${g.progress} / ${g.target} ${g.type === 'count' ? 'items' : 'checkpoints'}`}
              </div>
              <div class="progress-bar" style="height:6px;background:rgba(255,255,255,0.1);border-radius:3px;overflow:hidden;margin-bottom:8px">
                <div class="progress-fill" style="width:${pct}%;height:100%;background:linear-gradient(90deg, #d4af37, #f4d03f);border-radius:3px"></div>
              </div>
              ${nextMilestone ? `<div style="font-size:0.8rem;color:var(--secondary)">Next: ${nextMilestone.label}</div>` : '<div style="font-size:0.8rem;color:#d4af37">✓ Goal Complete!</div>'}
            </div>
          `;
        }).join('')}
      </div>
    `));
    summaryRow.appendChild(goalsGrid);
    root.appendChild(summaryRow);

    const memoryCard = el('div', 'card recent-memory-card');
    memoryCard.style.marginTop = '24px';
    if (state.memories.length > 0) {
      const recentMem = state.memories[0];
      memoryCard.innerHTML = `
        <div class="label">Recent Memory</div>
        <div class="memory-hero">${recentMem.emoji || '📸'}</div>
        <div class="memory-title">${recentMem.title}</div>
        <div class="note-meta">${recentMem.date}</div>
        <button class="btn" id="viewMemBtn">View Memory</button>
      `;
    } else {
      memoryCard.innerHTML = `
        <div class="label">Recent Memory</div>
        <div class="muted" style="padding:24px 0;text-align:center">No memory saved yet.</div>
      `;
    }
    root.appendChild(memoryCard);

    setTimeout(() => {
      const goalCards = document.querySelectorAll('.goal-card-home');
      goalCards.forEach(card => {
        card.onclick = () => {
          const goalId = card.dataset.goalId;
          const goal = state.goals.find(g => g.id === goalId);
          if (goal) showGoalDetail(goal);
        };
      });

      const startInput = document.getElementById('setStart');
      if (startInput) startInput.onchange = e => { state.couple.startDate = e.target.value; save(); location.reload(); };

      const answerBtn = document.getElementById('answerBtn');
      if (answerBtn) answerBtn.onclick = () => {
        const currentQ = state.questions[state.currentQuestion % state.questions.length];
        const ans = prompt('Your answer:');
        if (ans) {
          state.answeredQuestions.push({ question: currentQ, answer: ans, date: new Date().toISOString().split('T')[0], by: (state.auth.currentUser && state.auth.currentUser.username) ? state.auth.currentUser.username : state.couple.name1 });
          state.currentQuestion++;
          save();
          alert('Answer saved! 💕');
        }
      };

      document.querySelectorAll('.mood-option').forEach(button => {
        button.onclick = () => {
          const person = (state.auth.currentUser && state.auth.currentUser.username) ? state.auth.currentUser.username : state.couple.name1;
          state.mood.current[person] = button.dataset.mood;
          state.mood.updatedAt = new Date().toISOString();
          save();
          navigate('home');
        };
      });

      if (state.memories.length > 0) {
        const viewMemBtn = document.getElementById('viewMemBtn');
        if (viewMemBtn) viewMemBtn.onclick = () => showMemoryDetail(state.memories[0]);
      }

      document.querySelectorAll('.date-idea-checkbox').forEach(cb => {
        cb.onclick = () => {
          const idx = parseInt(cb.dataset.index);
          state.lists.dateIdeas[idx].completed = cb.checked;
          save();
          navigate('home');
        };
      });

      document.querySelectorAll('.delete-idea-btn').forEach(btn => {
        btn.onclick = (e) => {
          e.stopPropagation();
          const idx = parseInt(btn.dataset.index);
          if (confirm(`Delete "${state.lists.dateIdeas[idx].name}"?`)) {
            state.lists.dateIdeas.splice(idx, 1);
            save();
            navigate('home');
          }
        };
      });
    }, 50);

    return root;
  }

  function renderMemories() {
    const root = el('div');
    let activeFilter = 'all';
    let searchQuery = '';

    const searchRow = el('div', 'search-row');
    searchRow.innerHTML = `
      <input id="memSearch" placeholder="Search Memories" type="text">
      <div class="filter-tags">
        <button class="tab-btn active" data-filter="all">All</button>
        <button class="tab-btn" data-filter="photos">Photos</button>
        <button class="tab-btn" data-filter="trips">Trips</button>
        <button class="tab-btn" data-filter="dates">Dates</button>
      </div>
    `;
    root.appendChild(searchRow);

    const grid = el('div', 'memory-grid');
    root.appendChild(grid);

    const addForm = el('div', 'card');
    addForm.innerHTML = `
      <div class="label">Add Memory</div>
      <div style="display:grid;grid-template-columns:80px 1fr;gap:12px;margin-top:16px">
        <input id="memEmoji" placeholder="Emoji" value="📸" style="text-align:center;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:8px;padding:10px;color:var(--text)">
        <input id="memTitle" placeholder="Title" type="text" style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:8px;padding:10px;color:var(--text)">
        <input id="memLocation" placeholder="Location" type="text" style="grid-column:1 / -1;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:8px;padding:10px;color:var(--text)">
        <input id="memFile" type="file" accept="image/*" style="grid-column:1 / -1;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:8px;padding:10px;color:var(--text)">
        <textarea id="memStory" placeholder="Story..." style="grid-column:1 / -1;height:100px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:8px;padding:10px;color:var(--text)"></textarea>
      </div>
      <button id="addMemBtn" class="btn" style="margin-top:16px">Save Memory</button>
    `;
    root.appendChild(addForm);

    function updateGrid() {
      const filtered = state.memories.filter(m => {
        const text = `${m.title} ${m.story || m.text} ${m.location || ''}`.toLowerCase();
        const matchesSearch = !searchQuery || text.includes(searchQuery);
        const matchesFilter = activeFilter === 'all' || (m.category === activeFilter);
        return matchesSearch && matchesFilter;
      });
      grid.innerHTML = filtered.map(m => `
        <div class="memory-card" data-id="${m.date}-${m.title}" style="position: relative;">
          ${m.image ? `<div class="memory-image-preview"><img src="${m.image}" alt="${m.title}"></div>` : `<div class="memory-icon">${m.emoji || '📸'}</div>`}
          <div class="memory-title">${m.title}</div>
          <div class="memory-date">${m.date}</div>
          <div class="memory-location">${m.location || ''}</div>
          <button class="delete-memory-btn" data-mem-id="${m.date}-${m.title}" style="position: absolute; top: 8px; right: 8px; background: rgba(0, 0, 0, 0.6); border: none; color: var(--accent); cursor: pointer; font-size: 1.2rem; padding: 4px 8px; border-radius: 4px; display: none;">×</button>
        </div>
      `).join('') || '<div class="muted" style="grid-column:1/-1;text-align:center;padding:40px">No memories found.</div>';
      grid.querySelectorAll('.memory-card').forEach(card => {
        const id = card.dataset.id;
        const memory = state.memories.find(m => `${m.date}-${m.title}` === id);
        if (memory) {
          card.onclick = () => showMemoryDetail(memory);
          card.onmouseenter = () => {
            const btn = card.querySelector('.delete-memory-btn');
            if (btn) btn.style.display = 'block';
          };
          card.onmouseleave = () => {
            const btn = card.querySelector('.delete-memory-btn');
            if (btn) btn.style.display = 'none';
          };
        }
        const delBtn = card.querySelector('.delete-memory-btn');
        if (delBtn) {
          delBtn.onclick = (e) => {
            e.stopPropagation();
            const memId = delBtn.dataset.memId;
            if (confirm('Delete this memory?')) {
              state.memories = state.memories.filter(m => `${m.date}-${m.title}` !== memId);
              save();
              updateGrid();
            }
          };
        }
      });
    }

    setTimeout(() => {
      const searchInput = document.getElementById('memSearch');
      searchInput.oninput = e => { searchQuery = e.target.value.toLowerCase(); updateGrid(); };
      addForm.querySelectorAll('.tab-btn').forEach(btn => {
        btn.onclick = () => {
          searchRow.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          activeFilter = btn.dataset.filter;
          updateGrid();
        };
      });

      const addMemBtn = document.getElementById('addMemBtn');
      if (addMemBtn) addMemBtn.onclick = async () => {
        const emoji = document.getElementById('memEmoji').value || '📸';
        const title = document.getElementById('memTitle').value.trim();
        const location = document.getElementById('memLocation').value.trim();
        const file = document.getElementById('memFile').files[0];
        const story = document.getElementById('memStory').value.trim();
        if (!title || !story) return;
        let image = null;
        if (file) {
          image = await uploadPhoto(file);
        }
        state.memories.unshift({ emoji, title, location, image, story, category: 'photos', date: new Date().toISOString().split('T')[0] });
        save();
        updateGrid();
        document.getElementById('memEmoji').value = '📸';
        document.getElementById('memTitle').value = '';
        document.getElementById('memLocation').value = '';
        document.getElementById('memFile').value = '';
        document.getElementById('memStory').value = '';
      };
    }, 50);

    updateGrid();
    return root;
  }

  function renderMood() {
    const activePerson = state.mood.selectedPerson || state.couple.name1;
    const root = el('div', 'grid');
    const moodCard = el('div', 'col-12');
    moodCard.appendChild(el('div', 'card', `
      <div class="label">Mood Lab</div>
      <div class="mood-person-toggle">
        <button class="mood-person-btn ${activePerson === state.couple.name1 ? 'active' : ''}" data-person="${state.couple.name1}">${state.couple.name1}</button>
        <button class="mood-person-btn ${activePerson === state.couple.name2 ? 'active' : ''}" data-person="${state.couple.name2}">${state.couple.name2}</button>
      </div>
      <div class="mood-grid">
        ${state.mood.customMoods.map(m => `<button class="mood-option" data-mood="${m}">${m}</button>`).join('')}
      </div>
      <div class="mood-status">
        <div><strong>${state.couple.name1}:</strong> ${state.mood.current[state.couple.name1] || 'Not set'}</div>
        <div><strong>${state.couple.name2}:</strong> ${state.mood.current[state.couple.name2] || 'Not set'}</div>
        <div class="note-meta">Updated ${state.mood.updatedAt ? new Date(state.mood.updatedAt).toLocaleString() : 'never'}</div>
      </div>
      <div class="label" style="margin-top:20px">Create a custom mood</div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px">
        <input id="customMoodInput" placeholder="Emoji + mood label" type="text" style="flex:1;min-width:180px">
        <button class="btn btn-small" id="saveCustomMoodBtn">Add</button>
      </div>
    `));
    root.appendChild(moodCard);

    setTimeout(() => {
      document.querySelectorAll('.mood-option').forEach(button => {
        button.onclick = () => {
          const person = (state.auth.currentUser && state.auth.currentUser.username) ? state.auth.currentUser.username : state.couple.name1;
          state.mood.current[person] = button.dataset.mood;
          state.mood.updatedAt = new Date().toISOString();
          save();
          navigate('home');
        };
      });

      const saveCustom = document.getElementById('saveCustomMoodBtn');
      const customMoodInput = document.getElementById('customMoodInput');
      if (saveCustom && customMoodInput) {
        saveCustom.onclick = () => {
          const text = customMoodInput.value.trim();
          if (!text) return;
          if (!state.mood.customMoods.includes(text)) state.mood.customMoods.push(text);
          save();
          navigate('mood');
        };
      }
    }, 50);

    return root;
  }

  function renderCalendar() {
    const root = el('div');
    let currentMonth = new Date();
    const calContainer = el('div');
    root.appendChild(calContainer);

    const anniversaryDate = state.couple.startDate ? new Date(state.couple.startDate) : null;
    let nextAnniversary = null;
    if (anniversaryDate) {
      nextAnniversary = new Date(new Date().getFullYear(), anniversaryDate.getMonth(), anniversaryDate.getDate());
      if (nextAnniversary < new Date()) nextAnniversary.setFullYear(nextAnniversary.getFullYear() + 1);
    }

    // Use live state.events reference, not a snapshot
    const calendarEvents = state.events;

    function renderCal() {
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth();
      const first = new Date(year, month, 1);
      const last = new Date(year, month + 1, 0);

      const cal = el('div', 'card');
      cal.innerHTML = `
        <div class="flex-between" style="margin-bottom:16px">
          <h2 style="margin:0;font-size:1.5rem">${currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' }).toUpperCase()}</h2>
          <div style="display:flex;gap:8px">
            <button class="prevMonthBtn btn btn-sec btn-small">←</button>
            <button class="nextMonthBtn btn btn-sec btn-small">→</button>
          </div>
        </div>
        <div class="calendar-grid" id="calGrid"></div>
      `;
      calContainer.innerHTML = '';
      calContainer.appendChild(cal);

      const grid = document.getElementById('calGrid');
      if (!grid) return;
      
      const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
      days.forEach(d => {
        const h = el('div');
        h.style.fontWeight = '600';
        h.style.fontSize = '11px';
        h.style.color = 'var(--secondary)';
        h.style.textAlign = 'center';
        h.textContent = d;
        grid.appendChild(h);
      });

      for (let i = 0; i < first.getDay(); i++) grid.appendChild(el('div'));

      for (let i = 1; i <= last.getDate(); i++) {
        const day = el('div', 'calendar-day');
        const date = new Date(year, month, i);
        const dateStr = date.toISOString().split('T')[0];
        
        const eventsOn = calendarEvents.filter(e => e.date === dateStr);
        if (date.toDateString() === new Date().toDateString()) day.classList.add('today');
        
        day.innerHTML = `<div>${i}</div>${eventsOn.map(e => `<div style="font-size:8px">${e.emoji || '●'}</div>`).join('')}`;
        day.dataset.date = dateStr;
        day.onclick = () => showDateEventModal(dateStr);
        grid.appendChild(day);
      }

      setTimeout(() => {
        const btns = calContainer.querySelectorAll('.prevMonthBtn, .nextMonthBtn');
        if (btns[0]) btns[0].onclick = () => { currentMonth.setMonth(currentMonth.getMonth() - 1); renderCal(); };
        if (btns[1]) btns[1].onclick = () => { currentMonth.setMonth(currentMonth.getMonth() + 1); renderCal(); };
      }, 10);
    }

    setTimeout(() => { renderCal(); }, 50);

    // Events List - uses state.events directly (live reference)
    const eventsList = el('div', 'card');
    eventsList.innerHTML = '<div class="label" style="margin-bottom:16px">Upcoming Events</div><div id="upcomingEvents"></div>';
    root.appendChild(eventsList);

    function renderEvents() {
      setTimeout(() => {
        const upcoming = state.events.filter(e => new Date(e.date) >= new Date()).sort((a, b) => new Date(a.date) - new Date(b.date));
        const list = document.getElementById('upcomingEvents');
        if (list) {
          list.innerHTML = upcoming.map((e, i) => `
            <div class="note-item">
              <div style="flex:1"><div style="font-weight:600">${e.emoji || '•'} ${e.title}</div><div class="note-meta">${e.date}</div></div>
              <button class="delEvBtn btn btn-sec btn-small" data-date="${e.date}" data-title="${e.title}">×</button>
            </div>
          `).join('') || '<div class="muted">No upcoming events</div>';

          list.querySelectorAll('.delEvBtn').forEach((b) => {
            b.onclick = (e) => {
              e.preventDefault();
              e.stopPropagation();
              if (confirm(`Delete "${b.dataset.title}"?`)) {
                state.events = state.events.filter(evt => !(evt.date === b.dataset.date && evt.title === b.dataset.title));
                save();
                renderEvents();
              }
            };
          });
        }
      }, 10);
    }

    renderEvents();
    return root;
  }

  function renderLists() { /* keeping existing renderLists */ 
    const root = el('div');
    const tabs = el('div', 'tab-nav');
    tabs.innerHTML = `
      <button class="tab-btn active" data-list="travelList">✈️ Travel</button>
      <button class="tab-btn" data-list="movies">🎬 Movies</button>
      <button class="tab-btn" data-list="restaurants">🍽️ Restaurants</button>
      <button class="tab-btn" data-list="giftIdeas">🎁 Gift Ideas</button>
    `;
    root.appendChild(tabs);
    const content = el('div', 'card');
    root.appendChild(content);
    function renderList(listType) {
      const list = state.lists[listType] || [];
      content.innerHTML = `
        <div id="listItems"></div>
        <div class="list-add">
          <input id="listInput" placeholder="Add item..." type="text">
          <button id="listAddBtn" class="btn btn-small">+</button>
        </div>
      `;
      setTimeout(() => {
        const listItems = document.getElementById('listItems');
        if (listItems) {
          listItems.innerHTML = list.map((item, i) => `
            <div class="list-item" style="justify-content: space-between;">
              <div style="display: flex; align-items: center; gap: 10px; flex: 1;">
                <input type="checkbox" id="item-${i}" ${item.checked ? 'checked' : ''}>
                <label for="item-${i}" style="flex: 1;">${item.text || item}</label>
              </div>
              <button class="delete-list-btn" data-index="${i}" style="background: none; border: none; color: var(--accent); cursor: pointer; font-size: 1.1rem; padding: 0;">×</button>
            </div>
          `).join('') || '<div class="muted" style="padding:20px;text-align:center">No items yet</div>';
          listItems.querySelectorAll('input[type="checkbox"]').forEach((cb, i) => {
            cb.onchange = () => {
              if (typeof list[i] === 'string') list[i] = { text: list[i], checked: cb.checked };
              else list[i].checked = cb.checked;
              save();
            };
          });
          listItems.querySelectorAll('.delete-list-btn').forEach(btn => {
            btn.onclick = (e) => {
              e.stopPropagation();
              const idx = parseInt(btn.dataset.index);
              if (confirm(`Delete "${list[idx].text || list[idx]}"?`)) {
                state.lists[listType].splice(idx, 1);
                save();
                renderList(listType);
              }
            };
          });
        }
        const addBtn = document.getElementById('listAddBtn');
        const input = document.getElementById('listInput');
        if (addBtn && input) {
          addBtn.onclick = () => {
            const text = input.value.trim();
            if (!text) return;
            state.lists[listType].push({ text, checked: false });
            save();
            renderList(listType);
          };
          input.onkeypress = e => { if (e.key === 'Enter') addBtn.click(); };
        }
      }, 10);
    }
    renderList('travelList');
    tabs.querySelectorAll('.tab-btn').forEach(btn => {
      btn.onclick = () => {
        tabs.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        renderList(btn.dataset.list);
      };
    });
    return root;
  }

  function renderIdeas() { /* keeping existing renderIdeas */
    const root = el('div');
    const header = el('div', 'flex-between');
    header.innerHTML = `
      <div style="font-size: 1.2rem; font-weight: 600;">All Ideas</div>
      <button class="btn btn-small" id="addCustomIdeaBtn" style="padding: 8px 14px; font-size: 1.2rem; line-height: 1;">+</button>
    `;
    root.appendChild(header);
    const tabs = el('div', 'tab-nav');
    tabs.innerHTML = `
      <button class="tab-btn active" data-list="dateIdeas">💕 Date Ideas</button>
      <button class="tab-btn" data-list="travelList">✈️ Travel</button>
      <button class="tab-btn" data-list="movies">🎬 Movies</button>
      <button class="tab-btn" data-list="restaurants">🍽️ Restaurants</button>
      <button class="tab-btn" data-list="giftIdeas">🎁 Gift Ideas</button>
    `;
    root.appendChild(tabs);
    const content = el('div', 'card');
    root.appendChild(content);
    function renderList(listType) {
      const list = state.lists[listType] || [];
      content.innerHTML = `
        <div id="listItems"></div>
        <div class="list-add">
          <input id="listInput" placeholder="Add item..." type="text">
          <button id="listAddBtn" class="btn btn-small">+</button>
        </div>
      `;
      setTimeout(() => {
        const listItems = document.getElementById('listItems');
        if (listItems) {
          listItems.innerHTML = list.map((item, i) => `
            <div class="list-item" style="justify-content: space-between;">
              <div style="display: flex; align-items: center; gap: 10px; flex: 1;">
                <input type="checkbox" id="item-${i}" ${item.checked ? 'checked' : ''}>
                <label for="item-${i}" style="flex: 1;">${item.text || item}</label>
              </div>
              <button class="delete-list-btn" data-index="${i}" style="background: none; border: none; color: var(--accent); cursor: pointer; font-size: 1.1rem; padding: 0;">×</button>
            </div>
          `).join('') || '<div class="muted" style="padding:20px;text-align:center">No items yet</div>';
          listItems.querySelectorAll('input[type="checkbox"]').forEach((cb, i) => {
            cb.onchange = () => {
              if (typeof list[i] === 'string') list[i] = { text: list[i], checked: cb.checked };
              else list[i].checked = cb.checked;
              save();
            };
          });
          listItems.querySelectorAll('.delete-list-btn').forEach(btn => {
            btn.onclick = (e) => {
              e.stopPropagation();
              const idx = parseInt(btn.dataset.index);
              if (confirm(`Delete "${list[idx].text || list[idx]}"?`)) {
                state.lists[listType].splice(idx, 1);
                save();
                renderList(listType);
              }
            };
          });
        }
        const addBtn = document.getElementById('listAddBtn');
        const input = document.getElementById('listInput');
        if (addBtn && input) {
          addBtn.onclick = () => {
            const text = input.value.trim();
            if (!text) return;
            state.lists[listType].push({ text, checked: false });
            save();
            renderList(listType);
          };
          input.onkeypress = e => { if (e.key === 'Enter') addBtn.click(); };
        }
      }, 10);
    }
    renderList('dateIdeas');
    tabs.querySelectorAll('.tab-btn').forEach(btn => {
      btn.onclick = () => {
        tabs.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        renderList(btn.dataset.list);
      };
    });
    setTimeout(() => {
      const addBtn = document.getElementById('addCustomIdeaBtn');
      if (addBtn) {
        addBtn.onclick = () => {
          const activeTab = tabs.querySelector('.tab-btn.active');
          const listType = activeTab.dataset.list;
          const item = prompt('Add a new item:');
          if (item && item.trim()) {
            state.lists[listType].push({ text: item.trim(), checked: false });
            save();
            renderList(listType);
          }
        };
      }
    }, 10);
    return root;
  }

  function renderLogin() {
    const root = el('div');
    root.innerHTML = `
      <div class="card" style="max-width:480px;margin:0 auto;text-align:center">
        <div class="label">Member Login</div>
        <h2>Select your profile</h2>
        <div style="margin-top:24px;display:grid;gap:14px">
          <button class="btn" id="loginGab">Gab</button>
          <button class="btn btn-sec" id="loginAvi">Avi</button>
          <div class="muted" style="font-size:12px;padding-top:10px">This site is private for Gab and Avi only!</div>
        </div>
      </div>
    `;
    setTimeout(() => {
      const gabBtn = document.getElementById('loginGab');
      const aviBtn = document.getElementById('loginAvi');
      if (gabBtn) gabBtn.onclick = () => { state.auth.currentUser = { username: 'Gab' }; state.auth.token = 'Gab'; save(); navigate('home'); };
      if (aviBtn) aviBtn.onclick = () => { state.auth.currentUser = { username: 'Avi' }; state.auth.token = 'Avi'; save(); navigate('home'); };
    }, 50);
    return root;
  }

  function renderNotes() {
    const root = el('div');
    const header = el('div', 'flex-between');
    header.innerHTML = `
      <div>
        <div class="label">Notes Hub</div>
        <h2>Private thoughts & shared notes</h2>
      </div>
      <button class="btn btn-small" id="newNoteBtn">New Note</button>
    `;
    root.appendChild(header);
    const listCard = el('div', 'card');
    listCard.id = 'notesList';
    root.appendChild(listCard);
    const addCard = el('div', 'card');
    addCard.innerHTML = `
      <div class="label">Write a Note</div>
      <input id="noteTitle" placeholder="Title" type="text" style="margin-top:16px">
      <textarea id="noteBody" placeholder="Write your message..." style="margin-top:12px;height:130px"></textarea>
      <div class="flex-between" style="margin-top:14px">
        <div class="muted">Share a memory, idea, or secret</div>
        <button class="btn" id="saveNoteBtn">Save</button>
      </div>
    `;
    root.appendChild(addCard);
    function refreshNotes() {
      const notesList = document.getElementById('notesList');
      if (!notesList) return;
      notesList.innerHTML = state.notes.slice().reverse().map(note => `
        <div class="note-item">
          <div style="flex:1">
            <div style="font-weight:600">${note.title || 'Untitled note'}</div>
            <div class="note-meta">${note.date} · ${note.body.slice(0, 90)}${note.body.length > 90 ? '…' : ''}</div>
          </div>
          <button class="btn btn-sec btn-small" data-id="${note.id}">Delete</button>
        </div>
      `).join('') || '<div class="muted" style="padding:24px;text-align:center">No notes yet.</div>';
      notesList.querySelectorAll('button[data-id]').forEach(btn => {
        btn.onclick = () => { state.notes = state.notes.filter(n => n.id !== btn.dataset.id); save(); refreshNotes(); };
      });
    }
    setTimeout(() => {
      const saveBtn = document.getElementById('saveNoteBtn');
      const newBtn = document.getElementById('newNoteBtn');
      const titleInput = document.getElementById('noteTitle');
      const bodyInput = document.getElementById('noteBody');
      if (newBtn) newBtn.onclick = () => { titleInput.focus(); };
      if (saveBtn) saveBtn.onclick = () => {
        const title = titleInput.value.trim();
        const body = bodyInput.value.trim();
        if (!body) return;
        state.notes.push({ id: Date.now().toString(), title: title || 'Untitled', body, date: new Date().toISOString().split('T')[0] });
        save();
        titleInput.value = '';
        bodyInput.value = '';
        refreshNotes();
      };
    }, 50);
    refreshNotes();
    return root;
  }

  function renderPeriodTracker() { /* keeping existing */
    const root = el('div', 'period-tracker-page');
    const tracker = state.periodTracker;
    const lastDate = tracker.lastPeriodDate ? new Date(tracker.lastPeriodDate) : null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let dayInCycle = null;
    let cyclePhase = 'off';
    let phaseColor = '#666';
    let nextPeriodDate = null;
    let fertileStart = null;
    let fertileEnd = null;
    if (lastDate) {
      const daysDiff = Math.floor((today - lastDate) / 86400000);
      dayInCycle = daysDiff % tracker.averageLength;
      if (dayInCycle < tracker.periodLength) { cyclePhase = 'menstrual'; phaseColor = '#e74c3c'; }
      else if (dayInCycle < Math.floor(tracker.averageLength / 2) - 2) { cyclePhase = 'follicular'; phaseColor = '#f39c12'; }
      else if (dayInCycle >= Math.floor(tracker.averageLength / 2) - 2 && dayInCycle <= Math.floor(tracker.averageLength / 2) + 2) { cyclePhase = 'ovulation'; phaseColor = '#e91e63'; }
      else { cyclePhase = 'luteal'; phaseColor = '#9b59b6'; }
      const ovulationDay = Math.floor(tracker.averageLength / 2);
      fertileStart = new Date(lastDate); fertileStart.setDate(fertileStart.getDate() + (ovulationDay - 5));
      fertileEnd = new Date(lastDate); fertileEnd.setDate(fertileEnd.getDate() + (ovulationDay + 1));
      nextPeriodDate = new Date(lastDate); nextPeriodDate.setDate(nextPeriodDate.getDate() + tracker.averageLength);
    }
    function generateCycleCalendar() {
      let html = '';
      const currentMonth = new Date();
      for (let m = 0; m < 2; m++) {
        const month = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + m, 1);
        const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 0);
        const firstDay = month.getDay();
        html += `<div style="margin-bottom:28px;"><div style="font-weight:700;margin-bottom:14px;color:var(--text);font-size:1.1rem;">${month.toLocaleDateString('default', { month: 'long', year: 'numeric' })}</div><div style="display:grid;grid-template-columns:repeat(7,1fr);gap:6px;">`;
        html += ['S','M','T','W','T','F','S'].map(d => `<div style="color:var(--secondary);font-size:0.75rem;text-align:center;font-weight:700;padding:8px 0;">${d}</div>`).join('');
        for (let i = 0; i < firstDay; i++) html += '<div style="padding:8px;text-align:center;"></div>';
        for (let day = 1; day <= monthEnd.getDate(); day++) {
          const date = new Date(month.getFullYear(), month.getMonth(), day);
          date.setHours(0, 0, 0, 0);
          let dayColor = 'transparent', borderColor = '#333', textColor = 'var(--secondary)', isToday = false, emoji = '';
          if (date.getTime() === today.getTime()) { isToday = true; borderColor = 'var(--accent)'; textColor = 'var(--text)'; }
          if (lastDate && date >= lastDate) {
            const diff = Math.floor((date - lastDate) / 86400000);
            const cycleDay = diff % tracker.averageLength;
            if (cycleDay < tracker.periodLength) { dayColor = '#e74c3c'; emoji = '●'; textColor = '#fff'; borderColor = '#c0392b'; }
            else if (cycleDay >= Math.floor(tracker.averageLength / 2) - 2 && cycleDay <= Math.floor(tracker.averageLength / 2) + 2) { dayColor = '#e91e63'; emoji = '♡'; textColor = '#fff'; borderColor = '#c2185b'; }
          }
          html += `<div style="padding:8px;background:${dayColor};border:2px solid ${borderColor};border-radius:10px;text-align:center;font-size:0.9rem;color:${textColor};font-weight:${isToday?'700':'500'};min-height:32px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;">${emoji?`<div style="font-size:0.7rem;line-height:1;">${emoji}</div>`:''}<div style="line-height:1;">${day}</div></div>`;
        }
        html += '</div></div>';
      }
      return html;
    }
    root.innerHTML = `
      <div style="margin-bottom:24px"><div class="label" style="margin-bottom:8px">Period Tracker</div><h2 style="margin:0;margin-bottom:4px">Cycle Insights</h2><div class="note-meta">Track your cycle and stay informed</div></div>
      <div class="card" style="background:linear-gradient(135deg,${phaseColor}22 0%,${phaseColor}11 100%);border:1px solid ${phaseColor}44;margin-bottom:20px">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;">
          <div><div class="label">Current Phase</div><div style="font-size:1.8rem;font-weight:700;margin-top:8px;color:${phaseColor}">${cyclePhase==='menstrual'?'🩸 Menstrual':cyclePhase==='follicular'?'🌱 Follicular':cyclePhase==='ovulation'?'💗 Ovulation':cyclePhase==='luteal'?'🌙 Luteal':'Not tracked'}</div><div class="note-meta" style="margin-top:8px">${dayInCycle!==null?`Day ${dayInCycle+1} of ${tracker.averageLength}`:'Log your first period to start'}</div></div>
          <div><div class="label">Next Period</div><div style="font-size:1.8rem;font-weight:700;margin-top:8px;color:#e74c3c">${nextPeriodDate?nextPeriodDate.toLocaleDateString():'—'}</div><div class="note-meta" style="margin-top:8px">${nextPeriodDate?Math.ceil((nextPeriodDate-today)/86400000)+' days away':'Log period to predict'}</div></div>
        </div>
      </div>
      <div class="card" style="margin-bottom:20px"><div class="label" style="margin-bottom:16px">Cycle Calendar</div><div id="cycleCalendar">${generateCycleCalendar()}</div></div>
      <div class="card" style="margin-bottom:20px">
        <div class="label" style="margin-bottom:12px">Log Period</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px;">
          <div><div class="note-meta" style="margin-bottom:8px;">Period Start Date</div><input type="date" id="periodDate" value="${tracker.lastPeriodDate||''}" style="width:100%;padding:10px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:8px;color:var(--text);"></div>
          <div><div class="note-meta" style="margin-bottom:8px;">Period Length (days)</div><input type="number" id="periodLength" placeholder="Length" value="${tracker.periodLength}" min="1" max="10" style="width:100%;padding:10px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:8px;color:var(--text);"></div>
        </div>
        <textarea id="periodNote" placeholder="Additional notes..." style="width:100%;padding:10px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:8px;color:var(--text);height:80px;resize:none;"></textarea>
        <button id="savePeriodBtn" class="btn" style="margin-top:12px;width:100%;">Save Period Entry</button>
      </div>
      <div class="card"><div class="label" style="margin-bottom:16px">Cycle History</div><div id="periodLog"></div></div>
    `;
    function refreshLog() {
      const log = document.getElementById('periodLog');
      if (!log) return;
      log.innerHTML = tracker.entries.length === 0
        ? '<div class="muted" style="padding:24px;text-align:center">No entries yet.</div>'
        : tracker.entries.slice().reverse().map(entry => `
            <div style="padding:12px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.1);border-radius:8px;margin-bottom:8px;display:flex;justify-content:space-between;align-items:start;">
              <div style="flex:1;"><div style="font-weight:600;margin-bottom:4px;">${entry.date}</div><div class="note-meta">${entry.periodLength} day period · ${entry.flow||'normal'}</div></div>
              <button class="delete-period-btn" data-id="${entry.id}" style="background:rgba(231,76,60,0.2);border:1px solid rgba(231,76,60,0.4);color:#e74c3c;padding:6px 12px;border-radius:6px;cursor:pointer;font-size:0.85rem;">Delete</button>
            </div>
          `).join('');
      log.querySelectorAll('.delete-period-btn').forEach(btn => {
        btn.onclick = () => { tracker.entries = tracker.entries.filter(e => e.id !== btn.dataset.id); save(); refreshLog(); };
      });
    }
    setTimeout(() => {
      document.getElementById('savePeriodBtn').onclick = () => {
        const date = document.getElementById('periodDate').value;
        const length = parseInt(document.getElementById('periodLength').value, 10) || tracker.periodLength;
        const note = document.getElementById('periodNote').value.trim();
        if (!date) { alert('Please select a period start date'); return; }
        tracker.lastPeriodDate = date;
        tracker.periodLength = length;
        tracker.entries.push({ id: Date.now().toString(), date, periodLength: length, flow: 'normal', symptoms: [], note });
        if (tracker.entries.length > 1) {
          const sortedDates = tracker.entries.map(e => new Date(e.date).getTime()).sort((a,b) => a - b);
          let totalDays = 0;
          for (let i = 1; i < sortedDates.length; i++) totalDays += (sortedDates[i] - sortedDates[i-1]) / 86400000;
          tracker.averageLength = Math.round(totalDays / (sortedDates.length - 1)) || 28;
        }
        save();
        refreshLog();
        navigate('period');
      };
    }, 50);
    refreshLog();
    return root;
  }

  function renderPlaylist() {
    const root = el('div');
    root.innerHTML = `
      <div class="flex-between" style="margin-bottom:18px">
        <div><div class="label">Playlist Hub</div><h2>Shared mood music for your moments</h2></div>
        <button class="btn btn-small" id="addPlaylistBtn">Add Playlist</button>
      </div>
      <div id="playlistCards"></div>
      <div class="card" style="margin-top:20px">
        <div class="label">Add Song</div>
        <div style="display:grid;gap:12px;margin-top:16px">
          <input id="songName" placeholder="Song title" type="text">
          <input id="songArtist" placeholder="Artist" type="text">
          <select id="songPlaylist">${state.sharedPlaylists.map((p,idx) => `<option value="${idx}">${p.name}</option>`).join('')}</select>
          <button class="btn" id="saveSongBtn">Add Song</button>
        </div>
      </div>
    `;
    function refreshPlaylists() {
      const cards = document.getElementById('playlistCards');
      if (!cards) return;
      cards.innerHTML = state.sharedPlaylists.map((p,i) => `<div class="card playlist-card" style="margin-bottom:18px"><div class="flex-between"><div><div style="font-weight:600;font-size:1.15rem">${p.name}</div><div class="note-meta">${p.source} · ${p.songs.length} songs</div></div><button class="btn btn-sec btn-small" data-idx="${i}">Delete</button></div></div>`).join('') || '<div class="muted" style="padding:24px;text-align:center">No playlists yet.</div>';
      cards.querySelectorAll('button[data-idx]').forEach(btn => { btn.onclick = () => { state.sharedPlaylists.splice(parseInt(btn.dataset.idx,10),1); save(); refreshPlaylists(); }; });
    }
    setTimeout(() => {
      document.getElementById('addPlaylistBtn').onclick = () => { const name=prompt('New playlist name'); if(!name)return; state.sharedPlaylists.push({name,source:'Private',songs:[]}); save(); navigate('playlist'); };
      document.getElementById('saveSongBtn').onclick = () => {
        const song=document.getElementById('songName').value.trim(), artist=document.getElementById('songArtist').value.trim(), playlist=state.sharedPlaylists[parseInt(document.getElementById('songPlaylist').value,10)];
        if(!song||!artist||!playlist)return; playlist.songs.push(`${song} — ${artist}`); save(); document.getElementById('songName').value=''; document.getElementById('songArtist').value=''; refreshPlaylists();
      };
    }, 50);
    refreshPlaylists();
    return root;
  }

  function renderTrips() {
    const root = el('div');
    let selectedTripIndex = 0;
    const tripList = el('div', 'card');
    const tripDetail = el('div');
    function renderTripPanel() {
      const trip = state.trips[selectedTripIndex];
      if (!trip) { tripDetail.innerHTML = '<div class="card" style="padding:32px;text-align:center">No trips yet.</div>'; return; }
      tripDetail.innerHTML = `<div class="card"><div class="flex-between" style="margin-bottom:16px"><div><div class="label">Trip Plan</div><div class="trip-title">${trip.name}</div></div><button class="btn btn-small" id="saveTripUpdateBtn">Save</button></div><div class="grid" style="gap:14px"><div class="col-6"><div class="label">Budget</div><div class="note-meta">₱${trip.spent||0} spent of ₱${trip.budget}</div><input type="number" id="tripSpent" placeholder="Update spent" style="margin-top:14px" value="${trip.spent}"></div><div class="col-6"><div class="label">Dates</div><input type="date" id="tripStartDate" placeholder="Start date" style="margin-top:14px" value="${trip.startDate||''}"><input type="date" id="tripEndDate" placeholder="End date" style="margin-top:12px" value="${trip.endDate||''}"></div></div></div>`;
      setTimeout(() => {
        document.getElementById('saveTripUpdateBtn').onclick = () => { trip.spent=parseInt(document.getElementById('tripSpent').value,10)||trip.spent; trip.startDate=document.getElementById('tripStartDate').value; trip.endDate=document.getElementById('tripEndDate').value; save(); renderTripPanel(); };
      }, 50);
    }
    const addForm = el('div', 'col-12');
    addForm.appendChild(el('div', 'card', `<div class="label">Plan a Trip</div><div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px"><input id="tripName" placeholder="Trip name" style="flex:1;min-width:150px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:8px;padding:10px;color:var(--text)"><input type="number" id="tripBudget" placeholder="Budget" style="width:120px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:8px;padding:10px;color:var(--text)"><button id="addTripBtn" class="btn">Add</button></div>`));
    root.appendChild(addForm);
    tripList.innerHTML = '<div class="label">Your Trips</div>';
    tripList.style.marginTop = '18px';
    root.appendChild(tripList);
    root.appendChild(tripDetail);
    function refreshTrips() {
      tripList.innerHTML = `<div class="label">Your Trips</div>${state.trips.map((t,i) => `<div class="note-item" style="cursor:pointer;justify-content:space-between" data-index="${i}"><div><div style="font-weight:600">${t.name}</div><div class="note-meta">₱${t.spent||0} / ₱${t.budget||0}</div></div><div style="display:flex;align-items:center;gap:12px;"><div style="color:var(--secondary)">View</div><button class="delete-trip-btn" data-index="${i}" style="background:none;border:none;color:var(--accent);cursor:pointer;font-size:1.1rem;padding:0;">×</button></div></div>`).join('')}`;
      tripList.querySelectorAll('[data-index]').forEach(item => { item.onclick = (e) => { if(e.target.classList.contains('delete-trip-btn'))return; selectedTripIndex=parseInt(item.dataset.index,10); renderTripPanel(); }; });
      tripList.querySelectorAll('.delete-trip-btn').forEach(btn => { btn.onclick = (e) => { e.stopPropagation(); const idx=parseInt(btn.dataset.index); if(confirm('Delete?')){ state.trips.splice(idx,1); save(); refreshTrips(); }}; });
      if (state.trips.length) renderTripPanel();
    }
    setTimeout(() => {
      document.getElementById('addTripBtn').onclick = () => { const name=document.getElementById('tripName').value.trim(), budget=parseInt(document.getElementById('tripBudget').value,10)||0; if(!name||!budget)return; state.trips.push({name,budget,spent:0,checklist:[],itinerary:[],startDate:'',endDate:''}); save(); document.getElementById('tripName').value=''; document.getElementById('tripBudget').value=''; selectedTripIndex=state.trips.length-1; refreshTrips(); };
    }, 50);
    refreshTrips();
    return root;
  }

  function renderUs() {
    const root = el('div', 'grid us-page');
    const pageHeader = el('div', 'col-12');
    pageHeader.appendChild(el('div', 'us-page-header', `<div></div><button class="btn btn-small us-logout-btn" id="logoutBtn">Logout</button>`));
    root.appendChild(pageHeader);
    const infoCard = el('div', 'col-12');
    infoCard.appendChild(el('div', 'card', `<div style="text-align:center;font-size:3rem;margin-bottom:16px">💑</div><div class="couple-names" style="text-align:center">${state.couple.name1} <span class="heart">🖤</span> ${state.couple.name2}</div><div style="text-align:center;color:var(--secondary);margin-top:16px"><label style="display:block;margin-bottom:8px">Relationship Start Date</label><input type="date" id="anniversary" value="${state.couple.startDate||''}" style="margin-top:8px" disabled></div>`));
    root.appendChild(infoCard);
    const stats = el('div', 'col-12');
    const days = getDaysTogether();
    stats.appendChild(el('div', 'card', `<div class="label" style="margin-bottom:16px">Relationship Stats</div><div class="stats-grid"><div class="stat-card"><div class="stat-icon">❤️</div><div class="stat-number">${days.total}</div><div class="stat-label">Days Together</div></div><div class="stat-card"><div class="stat-icon">🎉</div><div class="stat-number">${state.events.length}</div><div class="stat-label">Dates</div></div><div class="stat-card"><div class="stat-icon">✈️</div><div class="stat-number">${state.trips.length}</div><div class="stat-label">Trips</div></div><div class="stat-card"><div class="stat-icon">📸</div><div class="stat-number">${state.memories.length}</div><div class="stat-label">Memories</div></div></div>`));
    root.appendChild(stats);
    const goalsCard = el('div', 'col-12');
    goalsCard.appendChild(el('div', 'card', `<div class="flex-between" style="margin-bottom:16px"><div><div class="label">Relationship Goals</div></div><button class="btn btn-small" id="goalExpandBtn">Manage</button></div><div id="usGoalsContainer">${state.goals.map(g=>`<div>${g.emoji} ${g.title}</div>`).join('')||'<div class="muted">No goals.</div>'}</div>`));
    root.appendChild(goalsCard);
    setTimeout(() => {
      document.getElementById('logoutBtn').onclick = () => { state.auth.currentUser = null; state.auth.token = null; save(); navigate('login'); };
    }, 50);
    const conversationsCard = el('div', 'col-12');
    conversationsCard.innerHTML = `<div class="card"><div class="label" style="margin-bottom:16px">Our Conversations 💬</div></div>`;
    root.appendChild(conversationsCard);
    const app = el('div'); app.appendChild(root);
    return app;
  }

  function showFAB() {
    const fabMenu = document.getElementById('fabMenu');
    if (fabMenu) fabMenu.classList.toggle('active');
  }

  function navigate(route) {
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.toggle('active', b.dataset.route === route));
    const app = document.getElementById('app');
    app.innerHTML = '';
    if (!state.auth.currentUser && route !== 'login') route = 'login';
    if (state.auth.currentUser && route === 'login') route = 'home';
    currentRoute = route;
    localStorage.setItem('gavvy-lastRoute', route);
    if (route === 'home') app.appendChild(renderHome());
    else if (route === 'memories') app.appendChild(renderMemories());
    else if (route === 'calendar') app.appendChild(renderCalendar());
    else if (route === 'lists') app.appendChild(renderLists());
    else if (route === 'ideas') app.appendChild(renderIdeas());
    else if (route === 'notes') app.appendChild(renderNotes());
    else if (route === 'period') app.appendChild(renderPeriodTracker());
    else if (route === 'trips') app.appendChild(renderTrips());
    else if (route === 'us') app.appendChild(renderUs());
    else if (route === 'login') app.appendChild(renderLogin());
  }

  function init() {
    const modalWrapper = el('div', 'modal');
    const modalContent = el('div');
    modalContent.id = 'memoryModal';
    modalWrapper.appendChild(modalContent);
    document.body.appendChild(modalWrapper);
    const fab = el('button', 'fab');
    fab.innerHTML = '+';
    fab.onclick = showFAB;
    document.body.appendChild(fab);
    const fabMenu = el('div', 'fab-menu');
    fabMenu.id = 'fabMenu';
    fabMenu.innerHTML = `<div class="fab-item" data-action="memory">📸 Add Memory</div><div class="fab-item" data-action="dateIdea">💕 Add Date Idea</div><div class="fab-item" data-action="note">📝 Add Note</div><div class="fab-item" data-action="goal">🎯 Add Goal</div><div class="fab-item" data-action="trip">✈️ Add Trip</div>`;
    document.body.appendChild(fabMenu);
    fabMenu.querySelectorAll('.fab-item').forEach(item => {
      item.onclick = () => {
        const action = item.dataset.action;
        if (action === 'memory') navigate('memories');
        else if (action === 'dateIdea') navigate('ideas');
        else if (action === 'note') navigate('notes');
        else if (action === 'goal') navigate('us');
        else if (action === 'trip') navigate('trips');
        fabMenu.classList.remove('active');
      };
    });
    document.querySelectorAll('.nav-btn').forEach(b => b.addEventListener('click', () => navigate(b.dataset.route)));
    let initialRoute = 'home';
    if (state.auth.currentUser) {
      const lastRoute = localStorage.getItem('gavvy-lastRoute');
      if (lastRoute && lastRoute !== 'login') initialRoute = lastRoute;
    } else { initialRoute = 'login'; }
    navigate(initialRoute);
  }
  return { init };
})();
document.addEventListener('DOMContentLoaded', () => GAVVY.init());
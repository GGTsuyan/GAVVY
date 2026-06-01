// GAVVY - Dark Luxury Couple App
const GAVVY = (() => {
  let state = {
    couple: { name1: 'Gab', name2: 'Avi', startDate: null, anniversary: null },
    memories: [],
    notes: [],
    events: [],
    goals: [
      { id: '1', emoji: '✈️', title: 'Japan 2027', type: 'savings', progress: 32500, target: 50000, deadline: '2027-12-31', milestones: [{ value: 10000, label: '₱10k', reward: '🎯 Dreamer' }, { value: 20000, label: '₱20k', reward: '🎯 Planner' }, { value: 30000, label: '₱30k', reward: '🏅 Saver' }, { value: 40000, label: '₱40k', reward: '🏅 Go-Getter' }, { value: 50000, label: '₱50k', reward: '🏆 Travel Legends' }], createdAt: '2026-01-15' },
      { id: '2', emoji: '🎬', title: 'Movie Challenge', type: 'count', progress: 67, target: 100, milestones: [{ value: 25, label: '25 Movies', reward: '🏅 Cinephile I' }, { value: 50, label: '50 Movies', reward: '🏅 Cinephile II' }, { value: 75, label: '75 Movies', reward: '🏅 Movie Master' }, { value: 100, label: '100 Movies', reward: '🏆 Movie Legends' }], items: [{ id: '1', name: 'Interstellar', completed: true, date: '2026-02-14' }, { id: '2', name: 'La La Land', completed: true, date: '2026-03-01' }, { id: '3', name: 'Her', completed: true, date: '2026-03-15' }], createdAt: '2026-01-01' }
    ],
    lists: { dateIdeas: [], travelList: [], movies: [], restaurants: [], giftIdeas: [] },
    trips: [],
    periodTracker: { entries: [], lastPeriodDate: null, averageLength: 28, periodLength: 5 },
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

  function save() { localStorage.setItem('gavvy-state', JSON.stringify(state)); }
  function load() { try { const s = localStorage.getItem('gavvy-state'); if (s) state = { ...state, ...JSON.parse(s) }; } catch (e) { } }

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

  load();
  state.couple.name1 = state.couple.name1 || 'Gab';
  state.couple.name2 = state.couple.name2 || 'Avi';
  if (state.couple.name1 === 'You') state.couple.name1 = 'Gab';
  if (state.couple.name2 === 'Partner') state.couple.name2 = 'Avi';
  if (!state.couple.startDate) state.couple.startDate = '2025-07-09';

  if (!state.mood.current || Object.keys(state.mood.current).length === 0) {
    state.mood.current = {
      [state.couple.name1]: state.mood.you || '😊 Happy',
      [state.couple.name2]: state.mood.partner || '😊 Happy'
    };
  }
  state.mood.customMoods = state.mood.customMoods || ['😊 Happy', '😌 Relaxed', '😴 Tired', '😔 Sad', '🤩 Excited'];
  state.mood.selectedPerson = state.mood.selectedPerson || state.couple.name1;
  
  // Clean up malformed goals
  state.goals = state.goals.filter(g => g && g.id && g.emoji && g.title && g.type !== undefined && g.progress !== undefined && g.target !== undefined);
  
  state.surprise = state.surprise || {
    Gab: { preview: 'Message locked until June 15, 2026 · 8:00 PM', message: 'Every day with you feels like the most beautiful adventure.', unlockDate: '2026-06-15T20:00:00' },
    Avi: { preview: 'Message locked until June 15, 2026 · 8:00 PM', message: 'Every day with you feels like the most beautiful adventure.', unlockDate: '2026-06-15T20:00:00' }
  };
  if (!state.surprise.Gab) state.surprise.Gab = { preview: 'Message locked until June 15, 2026 · 8:00 PM', message: 'Every day with you feels like the most beautiful adventure.', unlockDate: '2026-06-15T20:00:00' };
  if (!state.surprise.Avi) state.surprise.Avi = { preview: 'Message locked until June 15, 2026 · 8:00 PM', message: 'Every day with you feels like the most beautiful adventure.', unlockDate: '2026-06-15T20:00:00' };

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
              showGoalDetail(goal);
            }
          };
        }
      } else if (goal.type === 'count') {
        const incBtn = document.getElementById('goalIncrementBtn');
        const decBtn = document.getElementById('goalDecrementBtn');
        if (incBtn) incBtn.onclick = () => { if (goal.progress < goal.target) { goal.progress++; save(); showGoalDetail(goal); } };
        if (decBtn) decBtn.onclick = () => { if (goal.progress > 0) { goal.progress--; save(); showGoalDetail(goal); } };
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
              showGoalDetail(goal);
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
              showGoalDetail(goal);
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

  function showSurprise() {
    const user = (state.auth.currentUser && state.auth.currentUser.username) ? state.auth.currentUser.username : state.couple.name1;
    const surprise = state.surprise[user] || state.surprise[state.couple.name1];
    const receiver = user === state.couple.name1 ? state.couple.name2 : state.couple.name1;
    const unlock = new Date(surprise.unlockDate || '2026-06-15T20:00:00');
    const now = new Date();
    const modal = document.getElementById('memoryModal');
    if (!modal) return;
    if (now >= unlock) {
      modal.innerHTML = `
        <div class="modal-content">
          <button class="modal-close" id="closeModal">✕</button>
          <div class="surprise-box">
            <div class="label">Surprise Box</div>
            <div class="surprise-title">Message unlocked</div>
            <div class="muted" style="margin-top:12px">❤️ Sent to ${receiver}</div>
            <p style="margin-top:16px;color:var(--text)">${surprise.message}</p>
          </div>
        </div>
      `;
    } else {
      modal.innerHTML = `
        <div class="modal-content">
          <button class="modal-close" id="closeModal">✕</button>
          <div class="surprise-box locked">
            <div class="label">Surprise Box</div>
            <div class="surprise-title">Message locked</div>
            <div class="muted" style="margin-top:12px">${surprise.preview}</div>
            <div style="margin-top:16px">❤️ Scheduled for ${new Date(surprise.unlockDate).toLocaleDateString()}</div>
          </div>
        </div>
      `;
    }
    document.getElementById('memoryModal').parentElement.classList.add('active');
    document.getElementById('closeModal').onclick = () => document.getElementById('memoryModal').parentElement.classList.remove('active');
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
    startDateCard.innerHTML = `
      <div class="label">Relationship Start Date</div>
      <input type="date" id="setStart" value="${state.couple.startDate}" style="margin-top:16px;width:100%;" disabled>
    `;
    root.appendChild(startDateCard);

    const questionCard = el('div', 'question-card');
    questionCard.innerHTML = `
      <div class="question-label">Today's Question</div>
      <div class="question-text">"${state.questions[state.currentQuestion % state.questions.length]}"</div>
      <button class="question-btn" id="answerBtn">Answer</button>
    `;
    root.appendChild(questionCard);

    const summaryRow = el('div', 'grid');
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

    // Date Ideas Section
    const dateIdeasCard = el('div', 'card');
    let dateIdeasHTML = `
      <div style="margin-bottom: 16px;">
        <div class="label">Date Ideas 💑</div>
      </div>
      <div style="display: grid; gap: 12px;" id="dateIdeasList">
    `;
    
    if (state.lists.dateIdeas.length === 0) {
      dateIdeasHTML += `<div class="muted" style="padding: 16px; text-align: center;">No date ideas yet. Let's plan something special! 🌹</div>`;
    } else {
      dateIdeasHTML += state.lists.dateIdeas.map((idea, idx) => `
        <div style="display: flex; align-items: center; gap: 10px; padding: 10px; background: rgba(212, 175, 55, 0.05); border-radius: 4px;">
          <input type="checkbox" ${idea.completed ? 'checked' : ''} class="date-idea-checkbox" data-index="${idx}" style="cursor: pointer; width: 18px; height: 18px;">
          <span style="flex: 1; ${idea.completed ? 'text-decoration: line-through; color: var(--secondary);' : ''}">${idea.name}</span>
          <button class="delete-idea-btn" data-index="${idx}" style="background: none; border: none; color: var(--accent); cursor: pointer; font-size: 1.1rem;">×</button>
        </div>
      `).join('');
    }
    
    dateIdeasHTML += `</div>`;
    dateIdeasCard.innerHTML = dateIdeasHTML;
    root.appendChild(dateIdeasCard);

    const moodCard = el('div', 'card mood-card');
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

    const memoryCard = el('div', 'card recent-memory-card');
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

    const quickCard = el('div', 'card quick-actions');
    quickCard.innerHTML = `
      <div class="label">Quick Actions</div>
      <div class="quick-grid">
        <button class="btn btn-small" data-action="memory">Add Memory</button>
        <button class="btn btn-small" data-action="dateIdea">Add Date Idea</button>
        <button class="btn btn-small" data-action="note">Add Note</button>
        <button class="btn btn-small" data-action="goal">Add Goal</button>
        <button class="btn btn-small" data-action="trip">Add Trip</button>
        <button class="btn btn-small" data-action="surprise">Send Surprise</button>
      </div>
    `;
    root.appendChild(quickCard);

    const surpriseCard = el('div', 'card surprise-card');
    surpriseCard.innerHTML = `
      <div class="label">Surprise Box</div>
      <div class="surprise-preview">Message locked until June 15, 2026 · 8:00 PM</div>
      <button class="btn btn-small" id="openSurprise">Open Box</button>
    `;
    root.appendChild(surpriseCard);

    setTimeout(() => {
      const goalCards = document.querySelectorAll('.goal-card-home');
      goalCards.forEach(card => {
        card.onclick = () => {
          const goalId = card.dataset.goalId;
          const goal = state.goals.find(g => g.id === goalId);
          if (goal) {
            showGoalDetail(goal);
          }
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

      quickCard.querySelectorAll('button[data-action]').forEach(btn => {
        btn.onclick = () => {
          const action = btn.dataset.action;
          if (action === 'memory') navigate('memories');
          else if (action === 'dateIdea') navigate('ideas');
          else if (action === 'note') navigate('notes');
          else if (action === 'goal') navigate('us');
          else if (action === 'trip') navigate('trips');
          else if (action === 'surprise') showSurprise();
        };
      });

      const openSurprise = document.getElementById('openSurprise');
      if (openSurprise) openSurprise.onclick = showSurprise;

      // Date Ideas Handlers

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
        <input id="memEmoji" placeholder="Emoji" value="📸" style="text-align:center">
        <input id="memTitle" placeholder="Title" type="text">
        <input id="memLocation" placeholder="Location" type="text" style="grid-column:1 / -1">
        <input id="memFile" type="file" accept="image/*" style="grid-column:1 / -1">
        <textarea id="memStory" placeholder="Story..." style="grid-column:1 / -1;height:100px"></textarea>
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

    const calendarEvents = [...state.events];
    if (nextAnniversary) {
      calendarEvents.push({ emoji: '💖', title: 'Anniversary date', date: nextAnniversary.toISOString().split('T')[0] });
    }

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
        grid.appendChild(day);
      }

      setTimeout(() => {
        const btns = calContainer.querySelectorAll('.prevMonthBtn, .nextMonthBtn');
        if (btns[0]) btns[0].onclick = () => { currentMonth.setMonth(currentMonth.getMonth() - 1); renderCal(); };
        if (btns[1]) btns[1].onclick = () => { currentMonth.setMonth(currentMonth.getMonth() + 1); renderCal(); };
      }, 10);
    }

    renderCal();

    // Events List
    const eventsList = el('div', 'card');
    eventsList.innerHTML = '<div class="label" style="margin-bottom:16px">Upcoming Events</div><div id="upcomingEvents"></div>';
    root.appendChild(eventsList);

    function renderEvents() {
      setTimeout(() => {
        const upcoming = calendarEvents.filter(e => new Date(e.date) >= new Date()).sort((a, b) => new Date(a.date) - new Date(b.date));
        const list = document.getElementById('upcomingEvents');
        if (list) {
          list.innerHTML = upcoming.map((e, i) => `
            <div class="note-item">
              <div style="flex:1"><div style="font-weight:600">${e.emoji || '•'} ${e.title}</div><div class="note-meta">${e.date}</div></div>
              <button class="delEvBtn btn btn-sec btn-small" data-date="${e.date}" data-title="${e.title}">×</button>
            </div>
          `).join('') || '<div class="muted">No upcoming events</div>';

          list.querySelectorAll('.delEvBtn').forEach((b) => {
            b.onclick = () => {
              const eventDate = b.dataset.date;
              const eventTitle = b.dataset.title;
              if (confirm(`Delete "${eventTitle}"?`)) {
                state.events = state.events.filter(e => !(e.date === eventDate && e.title === eventTitle));
                save();
                renderEvents();
                renderCal();
              }
            };
          });
        }
      }, 10);
    }

    // Add Event Form
    const addForm = el('div', 'card');
    addForm.innerHTML = `
      <div class="label">Add Event</div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px">
        <input id="evEmoji" placeholder="🍽️" value="🍽️" style="width:50px;text-align:center">
        <input type="date" id="evDate">
        <input id="evTitle" placeholder="Event title" style="flex:1;min-width:150px">
        <button id="addEvBtn" class="btn">Add</button>
      </div>
    `;
    root.appendChild(addForm);

    renderEvents();

    setTimeout(() => {
      const addEvBtn = document.getElementById('addEvBtn');
      if (addEvBtn) {
        addEvBtn.onclick = () => {
          const emoji = document.getElementById('evEmoji').value || '•';
          const d = document.getElementById('evDate').value;
          const t = document.getElementById('evTitle').value.trim();
          if (!d || !t) return;
          state.events.push({ emoji, date: d, title: t });
          save();
          renderCal();
          renderEvents();
          document.getElementById('evDate').value = '';
          document.getElementById('evTitle').value = '';
        };
      }
    }, 10);

    return root;
  }

  function renderLists() {
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

  function renderIdeas() {
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

      if (gabBtn) {
        gabBtn.onclick = () => {
          state.auth.currentUser = { username: 'Gab' };
          state.auth.token = 'Gab';
          save();
          navigate('home');
        };
      }

      if (aviBtn) {
        aviBtn.onclick = () => {
          state.auth.currentUser = { username: 'Avi' };
          state.auth.token = 'Avi';
          save();
          navigate('home');
        };
      }
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
        btn.onclick = () => {
          const id = btn.dataset.id;
          state.notes = state.notes.filter(n => n.id !== id);
          save();
          refreshNotes();
        };
      });
    }

    setTimeout(() => {
      const saveBtn = document.getElementById('saveNoteBtn');
      const newBtn = document.getElementById('newNoteBtn');
      const titleInput = document.getElementById('noteTitle');
      const bodyInput = document.getElementById('noteBody');

      if (newBtn) newBtn.onclick = () => {
        titleInput.focus();
      };

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

  function renderPeriodTracker() {
    const root = el('div');
    const tracker = state.periodTracker;
    const lastDate = tracker.lastPeriodDate ? new Date(tracker.lastPeriodDate) : null;
    let nextStart = null;
    if (lastDate) {
      nextStart = new Date(lastDate);
      nextStart.setDate(nextStart.getDate() + tracker.averageLength);
    }

    root.innerHTML = `
      <div class="flex-between" style="margin-bottom:18px">
        <div>
          <div class="label">Period Tracker</div>
          <h2>Cycle rhythm & reminders</h2>
        </div>
        <button class="btn btn-small" id="addPeriodBtn">Log period</button>
      </div>
      <div class="grid">
        <div class="col-6">
          <div class="card">
            <div class="label">Last Period</div>
            <div style="margin-top:14px;font-size:1.15rem">${lastDate ? lastDate.toLocaleDateString() : 'Not logged yet'}</div>
            <div class="note-meta" style="margin-top:8px">Cycle length ${tracker.averageLength} days · Period ~${tracker.periodLength} days</div>
            ${nextStart ? `<div class="note-meta" style="margin-top:12px">Next expected start: ${nextStart.toLocaleDateString()}</div>` : ''}
          </div>
        </div>
        <div class="col-6">
          <div class="card">
            <div class="label">Mood & symptoms</div>
            <div class="note-meta">Track how you feel before and during your cycle.</div>
            <div class="emoji-pick" style="margin-top:16px">
              <span>🌙</span><span>💧</span><span>😴</span><span>❤️</span><span>✨</span>
            </div>
          </div>
        </div>
      </div>
      <div class="card" style="margin-top:20px">
        <div class="label">Cycle Log</div>
        <div id="periodLog"></div>
      </div>
    `;

    const formCard = el('div', 'card');
    formCard.innerHTML = `
      <div class="label">New Period Entry</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:16px">
        <input type="date" id="periodDate" value="${tracker.lastPeriodDate || ''}">
        <input type="number" id="periodLength" placeholder="Length (days)" value="${tracker.periodLength}">
      </div>
      <textarea id="periodNote" placeholder="Notes or symptoms" style="margin-top:12px;height:100px"></textarea>
      <button id="savePeriodBtn" class="btn" style="margin-top:16px">Save Entry</button>
    `;
    root.appendChild(formCard);

    function refreshLog() {
      const log = document.getElementById('periodLog');
      if (!log) return;
      log.innerHTML = tracker.entries.slice().reverse().map(entry => `
        <div class="note-item">
          <div style="flex:1">
            <div style="font-weight:600">${entry.date}</div>
            <div class="note-meta">${entry.periodLength} day cycle · ${entry.note || 'No note'}</div>
          </div>
          <button class="btn btn-sec btn-small" data-id="${entry.id}">Delete</button>
        </div>
      `).join('') || '<div class="muted" style="padding:24px;text-align:center">No period entries yet.</div>';
      log.querySelectorAll('button[data-id]').forEach(btn => {
        btn.onclick = () => {
          tracker.entries = tracker.entries.filter(e => e.id !== btn.dataset.id);
          save();
          refreshLog();
        };
      });
    }

    setTimeout(() => {
      const saveBtn = document.getElementById('savePeriodBtn');
      const addBtn = document.getElementById('addPeriodBtn');

      if (addBtn) addBtn.onclick = () => {
        document.getElementById('periodDate')?.focus();
      };
      if (saveBtn) saveBtn.onclick = () => {
        const date = document.getElementById('periodDate').value;
        const length = parseInt(document.getElementById('periodLength').value, 10) || tracker.periodLength;
        const note = document.getElementById('periodNote').value.trim();
        if (!date) return;
        tracker.lastPeriodDate = date;
        tracker.periodLength = length;
        tracker.entries.push({ id: Date.now().toString(), date, periodLength: length, note });
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
        <div>
          <div class="label">Playlist Hub</div>
          <h2>Shared mood music for your moments</h2>
        </div>
        <button class="btn btn-small" id="addPlaylistBtn">Add Playlist</button>
      </div>
      <div id="playlistCards"></div>
      <div class="card" style="margin-top:20px">
        <div class="label">Add Song</div>
        <div style="display:grid;gap:12px;margin-top:16px">
          <input id="songName" placeholder="Song title" type="text">
          <input id="songArtist" placeholder="Artist" type="text">
          <select id="songPlaylist">
            ${state.sharedPlaylists.map((p, idx) => `<option value="${idx}">${p.name}</option>`).join('')}
          </select>
          <button class="btn" id="saveSongBtn">Add Song</button>
        </div>
      </div>
    `;

    function refreshPlaylists() {
      const cards = document.getElementById('playlistCards');
      if (!cards) return;
      cards.innerHTML = state.sharedPlaylists.map((playlist, idx) => `
        <div class="card playlist-card" style="margin-bottom:18px">
          <div class="flex-between">
            <div>
              <div style="font-weight:600;font-size:1.15rem">${playlist.name}</div>
              <div class="note-meta">${playlist.source} · ${playlist.songs.length} songs</div>
            </div>
            <button class="btn btn-sec btn-small" data-idx="${idx}">Delete</button>
          </div>
          <div style="margin-top:14px">
            ${playlist.songs.map(song => `<div class="note-item" style="padding:10px 0;border:none;border-bottom:1px solid rgba(255,255,255,0.08)">${song}</div>`).join('')}
          </div>
        </div>
      `).join('') || '<div class="muted" style="padding:24px;text-align:center">No playlists yet.</div>';
      cards.querySelectorAll('button[data-idx]').forEach(btn => {
        btn.onclick = () => {
          state.sharedPlaylists.splice(parseInt(btn.dataset.idx, 10), 1);
          save();
          refreshPlaylists();
        };
      });
    }

    setTimeout(() => {
      const addPlaylistBtn = document.getElementById('addPlaylistBtn');
      const saveSongBtn = document.getElementById('saveSongBtn');
      const songName = document.getElementById('songName');
      const songArtist = document.getElementById('songArtist');
      const songPlaylist = document.getElementById('songPlaylist');

      if (addPlaylistBtn) {
        addPlaylistBtn.onclick = () => {
          const name = prompt('New playlist name');
          if (!name) return;
          state.sharedPlaylists.push({ name, source: 'Private', songs: [] });
          save();
          navigate('playlist');
        };
      }
      if (saveSongBtn) {
        saveSongBtn.onclick = () => {
          const song = songName.value.trim();
          const artist = songArtist.value.trim();
          const playlist = state.sharedPlaylists[parseInt(songPlaylist.value, 10)];
          if (!song || !artist || !playlist) return;
          playlist.songs.push(`${song} — ${artist}`);
          save();
          songName.value = '';
          songArtist.value = '';
          refreshPlaylists();
        };
      }
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
      if (!trip) {
        tripDetail.innerHTML = '<div class="card" style="padding:32px;text-align:center">No trips yet. Add one to begin planning your next adventure.</div>';
        return;
      }

      tripDetail.innerHTML = `
        <div class="card">
          <div class="flex-between" style="margin-bottom:16px">
            <div>
              <div class="label">Trip Plan</div>
              <div class="trip-title">${trip.name}</div>
            </div>
            <button class="btn btn-small" id="saveTripUpdateBtn">Save</button>
          </div>
          <div class="grid" style="gap:14px">
            <div class="col-6">
              <div class="label">Budget</div>
              <div class="note-meta">₱${trip.spent || 0} spent of ₱${trip.budget}</div>
              <div class="trip-budget-bar"><div class="trip-budget-fill" style="width:${Math.min((trip.spent / trip.budget) * 100 || 0, 100)}%"></div></div>
              <input type="number" id="tripSpent" placeholder="Update spent" style="margin-top:14px" value="${trip.spent}">
            </div>
            <div class="col-6">
              <div class="label">Dates</div>
              <input type="date" id="tripStartDate" placeholder="Start date" style="margin-top:14px" value="${trip.startDate || ''}">
              <input type="date" id="tripEndDate" placeholder="End date" style="margin-top:12px" value="${trip.endDate || ''}">
            </div>
          </div>
          <div class="grid" style="margin-top:22px;gap:14px">
            <div class="col-6">
              <div class="label">Checklist</div>
              <div id="tripChecklist">${(trip.checklist || []).map(item => `
                <div class="note-item" style="justify-content: space-between;">
                  <label style="display: flex; align-items: center; gap: 8px; flex: 1;">
                    <input type="checkbox" data-check="${item.id}" ${item.checked ? 'checked' : ''}> ${item.text}
                  </label>
                  <button class="delete-check-btn" data-check-id="${item.id}" style="background: none; border: none; color: var(--accent); cursor: pointer; font-size: 1.1rem; padding: 0;">×</button>
                </div>
              `).join('') || '<div class="muted" style="padding:12px">No items yet.</div>'}</div>
              <div style="display:flex;gap:8px;margin-top:12px">
                <input id="newChecklistItem" placeholder="Add checklist item" style="flex:1">
                <button class="btn btn-small" id="addChecklistItemBtn">Add</button>
              </div>
            </div>
            <div class="col-6">
              <div class="label">Itinerary</div>
              <div id="tripItinerary">${(trip.itinerary || []).map((entry, idx) => `
                <div class="note-item" style="justify-content: space-between;">
                  <div>${entry}</div>
                  <button class="delete-itin-btn" data-itin-index="${idx}" style="background: none; border: none; color: var(--accent); cursor: pointer; font-size: 1.1rem; padding: 0;">×</button>
                </div>
              `).join('') || '<div class="muted" style="padding:12px">No itinerary items yet.</div>'}</div>
              <div style="display:flex;gap:8px;margin-top:12px">
                <input id="newItineraryItem" placeholder="Add itinerary item" style="flex:1">
                <button class="btn btn-small" id="addItineraryItemBtn">Add</button>
              </div>
            </div>
          </div>
        </div>
      `;

      setTimeout(() => {
        const saveBtn = document.getElementById('saveTripUpdateBtn');
        const spentInput = document.getElementById('tripSpent');
        const startInput = document.getElementById('tripStartDate');
        const endInput = document.getElementById('tripEndDate');
        const checklistInput = document.getElementById('newChecklistItem');
        const itineraryInput = document.getElementById('newItineraryItem');
        const addChecklist = document.getElementById('addChecklistItemBtn');
        const addItinerary = document.getElementById('addItineraryItemBtn');

        if (saveBtn) {
          saveBtn.onclick = () => {
            trip.spent = parseInt(spentInput.value, 10) || trip.spent;
            trip.startDate = startInput.value;
            trip.endDate = endInput.value;
            save();
            renderTripPanel();
          };
        }

        if (addChecklist) {
          addChecklist.onclick = () => {
            const text = checklistInput.value.trim();
            if (!text) return;
            trip.checklist = trip.checklist || [];
            trip.checklist.push({ id: Date.now().toString(), text, checked: false });
            save();
            renderTripPanel();
          };
        }

        if (addItinerary) {
          addItinerary.onclick = () => {
            const text = itineraryInput.value.trim();
            if (!text) return;
            trip.itinerary = trip.itinerary || [];
            trip.itinerary.push(text);
            save();
            renderTripPanel();
          };
        }

        tripDetail.querySelectorAll('input[data-check]').forEach(cb => {
          cb.onchange = () => {
            const item = trip.checklist.find(entry => entry.id === cb.dataset.check);
            if (item) {
              item.checked = cb.checked;
              save();
            }
          };
        });

        tripDetail.querySelectorAll('.delete-check-btn').forEach(btn => {
          btn.onclick = (e) => {
            e.stopPropagation();
            const checkId = btn.dataset.checkId;
            const itemIdx = trip.checklist.findIndex(item => item.id === checkId);
            if (itemIdx > -1) {
              if (confirm(`Delete "${trip.checklist[itemIdx].text}"?`)) {
                trip.checklist.splice(itemIdx, 1);
                save();
                renderTripPanel();
              }
            }
          };
        });

        tripDetail.querySelectorAll('.delete-itin-btn').forEach(btn => {
          btn.onclick = (e) => {
            e.stopPropagation();
            const idx = parseInt(btn.dataset.itinIndex);
            if (confirm(`Delete "${trip.itinerary[idx]}"?`)) {
              trip.itinerary.splice(idx, 1);
              save();
              renderTripPanel();
            }
          };
        });
      }, 50);
    }

    const addForm = el('div', 'col-12');
    addForm.appendChild(el('div', 'card', `
      <div class="label">Plan a Trip</div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px">
        <input id="tripName" placeholder="Trip name (e.g., Tokyo Escape)" style="flex:1;min-width:150px">
        <input type="number" id="tripBudget" placeholder="Budget" style="width:120px">
        <button id="addTripBtn" class="btn">Add</button>
      </div>
    `));
    root.appendChild(addForm);

    tripList.innerHTML = '<div class="label">Your Trips</div>';
    tripList.style.marginTop = '18px';
    root.appendChild(tripList);
    root.appendChild(tripDetail);

    function refreshTrips() {
      tripList.innerHTML = `
        <div class="label">Your Trips</div>
        ${state.trips.map((trip, idx) => `
          <div class="note-item" style="cursor:pointer;justify-content:space-between" data-index="${idx}">
            <div>
              <div style="font-weight:600">${trip.name}</div>
              <div class="note-meta">₱${trip.spent || 0} / ₱${trip.budget || 0}</div>
            </div>
            <div style="display: flex; align-items: center; gap: 12px;">
              <div style="color:var(--secondary)">View</div>
              <button class="delete-trip-btn" data-index="${idx}" style="background: none; border: none; color: var(--accent); cursor: pointer; font-size: 1.1rem; padding: 0;">×</button>
            </div>
          </div>
        `).join('')}
      `;
      tripList.querySelectorAll('[data-index]').forEach(item => {
        item.onclick = (e) => {
          if (e.target.classList.contains('delete-trip-btn')) return;
          selectedTripIndex = parseInt(item.dataset.index, 10);
          renderTripPanel();
        };
      });
      
      tripList.querySelectorAll('.delete-trip-btn').forEach(btn => {
        btn.onclick = (e) => {
          e.stopPropagation();
          const idx = parseInt(btn.dataset.index);
          if (confirm(`Delete trip "${state.trips[idx].name}"?`)) {
            state.trips.splice(idx, 1);
            save();
            if (selectedTripIndex >= state.trips.length && selectedTripIndex > 0) {
              selectedTripIndex--;
            }
            refreshTrips();
          }
        };
      });
      if (state.trips.length) renderTripPanel();
    }

    setTimeout(() => {
      const addTripBtn = document.getElementById('addTripBtn');
      if (addTripBtn) {
        addTripBtn.onclick = () => {
          const name = document.getElementById('tripName').value.trim();
          const budget = parseInt(document.getElementById('tripBudget').value, 10) || 0;
          if (!name || !budget) return;
          state.trips.push({ name, budget, spent: 0, checklist: [], itinerary: [], startDate: '', endDate: '' });
          save();
          document.getElementById('tripName').value = '';
          document.getElementById('tripBudget').value = '';
          selectedTripIndex = state.trips.length - 1;
          refreshTrips();
        };
      }
    }, 50);

    refreshTrips();
    return root;
  }

  function renderUs() {
    const root = el('div', 'grid us-page');

    const pageHeader = el('div', 'col-12');
    pageHeader.appendChild(el('div', 'us-page-header', `
      <div></div>
      <button class="btn btn-small us-logout-btn" id="logoutBtn">Logout</button>
    `));
    root.appendChild(pageHeader);

    // Couple Info Card
    const infoCard = el('div', 'col-12');
    infoCard.appendChild(el('div', 'card', `
      <div style="text-align:center;font-size:3rem;margin-bottom:16px">💑</div>
      <div class="couple-names" style="text-align:center">${state.couple.name1} <span class="heart">🖤</span> ${state.couple.name2}</div>
      <div style="text-align:center;color:var(--secondary);margin-top:16px">
        <label style="display:block;margin-bottom:8px">Relationship Start Date</label>
        <input type="date" id="anniversary" value="${state.couple.startDate || ''}" style="margin-top:8px" disabled>
      </div>
    `));
    root.appendChild(infoCard);

    // Stats
    const stats = el('div', 'col-12');
    const days = getDaysTogether();
    const user = (state.auth.currentUser && state.auth.currentUser.username) ? state.auth.currentUser.username : state.couple.name1;
    const other = user === state.couple.name1 ? state.couple.name2 : state.couple.name1;
    stats.appendChild(el('div', 'card', `
      <div class="label" style="margin-bottom:16px">Relationship Stats</div>
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon">❤️</div>
          <div class="stat-number">${days.total}</div>
          <div class="stat-label">Days Together</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">🎉</div>
          <div class="stat-number">${state.events.length}</div>
          <div class="stat-label">Dates</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">✈️</div>
          <div class="stat-number">${state.trips.length}</div>
          <div class="stat-label">Trips</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">📸</div>
          <div class="stat-number">${state.memories.length}</div>
          <div class="stat-label">Memories</div>
        </div>
      </div>
    `));
    root.appendChild(stats);

    const goalsCard = el('div', 'col-12');
    goalsCard.appendChild(el('div', 'card', `
      <div class="flex-between" style="margin-bottom:16px">
        <div>
          <div class="label">Relationship Goals</div>
          <div style="font-size:0.9rem;color:var(--secondary)">Track shared milestones and achievements.</div>
        </div>
        <button class="btn btn-small" id="goalExpandBtn">Manage</button>
      </div>
      <div id="usGoalsContainer" style="display:grid;gap:12px">
        ${state.goals.length ? state.goals.map(goal => {
          const pct = Math.round((goal.progress / goal.target) * 100);
          return `
            <div class="goal-item-us" data-goal-id="${goal.id}" style="padding:12px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.1);border-radius:10px;display:flex;gap:12px;align-items:center;justify-content:space-between">
              <div style="flex:1;cursor:pointer" class="goal-view-area">
                <div style="display:flex;justify-content:space-between;margin-bottom:8px">
                  <strong>${goal.emoji} ${goal.title}</strong>
                  <span style="color:var(--secondary);font-size:0.9rem">${pct}%</span>
                </div>
                <div style="display:flex;gap:12px;align-items:center">
                  <div class="progress-bar" style="flex:1;height:6px;background:rgba(255,255,255,0.1);border-radius:3px;overflow:hidden">
                    <div class="progress-fill" style="width:${pct}%;height:100%;background:linear-gradient(90deg, #d4af37, #f4d03f)"></div>
                  </div>
                  <div style="font-size:0.8rem;color:var(--secondary);min-width:100px;text-align:right">
                    ${goal.type === 'savings' ? `₱${goal.progress.toLocaleString()}` : `${goal.progress}`} / ${goal.type === 'savings' ? `₱${goal.target.toLocaleString()}` : goal.target}
                  </div>
                </div>
              </div>
              <button class="btn btn-sec btn-small goal-delete-btn" data-goal-id="${goal.id}" style="padding:8px 12px;flex-shrink:0">×</button>
            </div>
          `;
        }).join('') : '<div class="muted" style="padding:20px;text-align:center">No goals yet.</div>'}
      </div>
      <div id="goalExpandPanel" style="display:none;margin-top:18px;border-top:1px solid rgba(255,255,255,0.1);padding-top:18px">
        <div class="label" style="margin-bottom:12px">Add New Goal</div>
        <div style="display:grid;gap:12px">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
            <input id="goalEmoji" placeholder="Emoji" value="✨" style="text-align:center" maxlength="2">
            <input id="goalTitle" placeholder="Goal title" type="text">
          </div>
          <select id="goalType" style="padding:10px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:8px;color:var(--text)">
            <option value="savings">💰 Savings Goal</option>
            <option value="count">🎯 Count Goal</option>
            <option value="list">📋 List/Checklist</option>
          </select>
          <input id="goalTarget" placeholder="Target number" type="number" min="1">
          <input id="goalDeadline" placeholder="Deadline (optional)" type="date">
          <button id="goalAddBtn" class="btn">Create Goal</button>
        </div>
      </div>
    `));
    root.appendChild(goalsCard);

    setTimeout(() => {
      const logoutBtn = document.getElementById('logoutBtn');
      if (logoutBtn) logoutBtn.onclick = () => { state.auth.currentUser = null; state.auth.token = null; save(); navigate('login'); };

      const goalExpandBtn = document.getElementById('goalExpandBtn');
      const goalExpandPanel = document.getElementById('goalExpandPanel');
      if (goalExpandBtn && goalExpandPanel) {
        goalExpandBtn.onclick = () => goalExpandPanel.style.display = goalExpandPanel.style.display === 'none' ? 'block' : 'none';
      }

      const goalItems = document.querySelectorAll('.goal-item-us');
      goalItems.forEach(item => {
        const goalViewArea = item.querySelector('.goal-view-area');
        const deleteBtn = item.querySelector('.goal-delete-btn');
        if (goalViewArea) {
          goalViewArea.onclick = () => {
            const goalId = item.dataset.goalId;
            const goal = state.goals.find(g => g.id === goalId);
            if (goal) showGoalDetail(goal);
          };
        }
        if (deleteBtn) {
          deleteBtn.onclick = (e) => {
            e.stopPropagation();
            const goalId = deleteBtn.dataset.goalId;
            if (confirm('Delete this goal?')) {
              state.goals = state.goals.filter(g => g.id !== goalId);
              save();
              navigate('us');
            }
          };
        }
      });

      const goalAddBtn = document.getElementById('goalAddBtn');
      const goalEmoji = document.getElementById('goalEmoji');
      const goalTitle = document.getElementById('goalTitle');
      const goalType = document.getElementById('goalType');
      const goalTarget = document.getElementById('goalTarget');
      const goalDeadline = document.getElementById('goalDeadline');

      if (goalAddBtn) goalAddBtn.onclick = () => {
        const emoji = goalEmoji?.value?.trim() || '✨';
        const title = goalTitle?.value?.trim();
        const type = goalType?.value || 'count';
        const target = parseInt(goalTarget?.value, 10) || 100;
        const deadline = goalDeadline?.value || null;
        if (!title) return;
        state.goals.push({
          id: Date.now().toString(),
          emoji,
          title,
          type,
          progress: 0,
          target,
          deadline,
          milestones: [{ value: Math.floor(target * 0.25), label: Math.floor(target * 0.25), reward: '🏅 Progress' }, { value: Math.floor(target * 0.5), label: Math.floor(target * 0.5), reward: '🏅 Halfway' }, { value: Math.floor(target * 0.75), label: Math.floor(target * 0.75), reward: '🏆 Almost There' }, { value: target, label: target, reward: '🏆 Complete' }],
          items: [],
          createdAt: new Date().toISOString()
        });
        save();
        navigate('us');
      };
    }, 50);

    const surpriseCard = el('div', 'col-12');
    const unlockDatetime = state.surprise[user].unlockDate || '2026-06-15';
    const unlockDate = unlockDatetime.split('T')[0] || '2026-06-15';
    const unlockTime = unlockDatetime.split('T')[1]?.slice(0, 5) || '20:00';
    
    function formatSurprisePreview(date, time) {
      if (!date) return 'Message locked until date set';
      const dateObj = new Date(date);
      const dateStr = dateObj.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
      return `Message locked until ${dateStr} · ${time}`;
    }
    
    const previewText = formatSurprisePreview(unlockDate, unlockTime);
    
    surpriseCard.appendChild(el('div', 'card', `
      <div class="label">Surprise Settings for ${other}</div>
      <div class="muted">Customize the surprise only you can see before sending.</div>
      <div style="display:grid;gap:12px;margin-top:16px">
        <div style="padding:12px;background:rgba(212, 175, 55, 0.08);border:1px solid rgba(212, 175, 55, 0.2);border-radius:8px;font-size:0.95rem;color:var(--text)">${previewText}</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
          <input type="date" id="surpriseDate" value="${unlockDate}" style="padding:10px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:8px;color:var(--text)">
          <input type="time" id="surpriseTime" value="${unlockTime}" style="padding:10px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:8px;color:var(--text)">
        </div>
        <textarea id="surpriseMessage" placeholder="Unlocked surprise message" style="min-height:100px;padding:10px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:8px;color:var(--text)">${state.surprise[user].message}</textarea>
        <button class="btn btn-small" id="saveSurpriseBtn">Save Surprise</button>
      </div>
    `));
    root.appendChild(surpriseCard);

    setTimeout(() => {
      const saveSurpriseBtn = document.getElementById('saveSurpriseBtn');
      const surpriseMessage = document.getElementById('surpriseMessage');
      const surpriseDate = document.getElementById('surpriseDate');
      const surpriseTime = document.getElementById('surpriseTime');
      const previewDiv = surpriseCard.querySelector('div[style*="background:rgba(212"]');
      
      const updatePreview = () => {
        if (previewDiv && surpriseDate && surpriseTime) {
          const newPreview = formatSurprisePreview(surpriseDate.value, surpriseTime.value);
          previewDiv.textContent = newPreview;
        }
      };
      
      if (surpriseDate) surpriseDate.onchange = updatePreview;
      if (surpriseTime) surpriseTime.onchange = updatePreview;
      
      if (saveSurpriseBtn && surpriseMessage && surpriseDate && surpriseTime) {
        saveSurpriseBtn.onclick = () => {
          const datetime = surpriseDate.value && surpriseTime.value ? `${surpriseDate.value}T${surpriseTime.value}:00` : state.surprise[user].unlockDate;
          state.surprise[user].preview = formatSurprisePreview(surpriseDate.value, surpriseTime.value);
          state.surprise[user].message = surpriseMessage.value.trim() || state.surprise[user].message;
          state.surprise[user].unlockDate = datetime;
          save();
          alert('Surprise saved! 💝');
        };
      }
    }, 50);

    // Our Conversations - Answered Questions
    const conversationsCard = el('div', 'col-12');
    let conversationsHTML = `
      <div class="card">
        <div class="label" style="margin-bottom:16px">Our Conversations 💬</div>
        <div style="display: grid; gap: 12px;">
    `;
    
    if (state.answeredQuestions.length === 0) {
      conversationsHTML += `<div style="color: var(--secondary); text-align: center; padding: 16px;">No conversations yet. Start by answering today's question!</div>`;
    } else {
      state.answeredQuestions.slice().reverse().forEach((qa, idx) => {
        conversationsHTML += `
          <div style="border-left: 3px solid var(--accent); padding: 12px; background: rgba(212, 175, 55, 0.05); border-radius: 4px;">
            <div style="color: var(--secondary); font-size: 0.85rem; margin-bottom: 6px;">${qa.date} · ${qa.by}</div>
            <div style="font-size: 0.95rem; margin-bottom: 8px; font-style: italic; color: var(--secondary);">Q: ${qa.question}</div>
            <div style="font-size: 0.95rem; color: var(--text);">A: ${qa.answer}</div>
          </div>
        `;
      });
    }
    
    conversationsHTML += `</div></div>`;
    conversationsCard.innerHTML = conversationsHTML;
    root.appendChild(conversationsCard);

    const app = el('div'); app.appendChild(root);
    setTimeout(() => {
      const annInput = document.getElementById('anniversary');
      if (annInput) annInput.onchange = e => { state.couple.anniversary = e.target.value; save(); };
    }, 50);

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
    // Add memory modal
    const modalWrapper = el('div', 'modal');
    const modalContent = el('div');
    modalContent.id = 'memoryModal';
    modalWrapper.appendChild(modalContent);
    document.body.appendChild(modalWrapper);

    // Add floating action button
    const fab = el('button', 'fab');
    fab.innerHTML = '+';
    fab.onclick = showFAB;
    document.body.appendChild(fab);

    const fabMenu = el('div', 'fab-menu');
    fabMenu.id = 'fabMenu';
    fabMenu.innerHTML = `
      <div class="fab-item" data-action="memory">📸 Add Memory</div>
      <div class="fab-item" data-action="dateIdea">💕 Add Date Idea</div>
      <div class="fab-item" data-action="note">📝 Add Note</div>
      <div class="fab-item" data-action="goal">🎯 Add Goal</div>
      <div class="fab-item" data-action="trip">✈️ Add Trip</div>
      <div class="fab-item" data-action="surprise">🎁 Surprise</div>
    `;
    document.body.appendChild(fabMenu);

    fabMenu.querySelectorAll('.fab-item').forEach(item => {
      item.onclick = () => {
        const action = item.dataset.action;
        if (action === 'memory') navigate('memories');
        else if (action === 'dateIdea') navigate('ideas');
        else if (action === 'note') navigate('notes');
        else if (action === 'goal') {
          navigate('us');
        }
        else if (action === 'trip') navigate('trips');
        else if (action === 'surprise') showSurprise();
        fabMenu.classList.remove('active');
      };
    });

    document.querySelectorAll('.nav-btn').forEach(b => b.addEventListener('click', () => navigate(b.dataset.route)));
    if (state.auth.currentUser) navigate('home'); else navigate('login');
  }

  return { init };
})();

document.addEventListener('DOMContentLoaded', () => GAVVY.init());

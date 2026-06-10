// GAVVY - Minimal Working Version
var GAVVY = (function() {
  var state = {
    couple: { name1: 'Gab', name2: 'Avi', startDate: null },
    memories: [], notes: [], events: [],
    goals: [],
    lists: { dateIdeas: [], travelList: [], movies: [], restaurants: [], giftIdeas: [] },
    trips: [],
    periodTracker: { entries: [], lastPeriodDate: null, averageLength: 36, periodLength: 6 },
    auth: { currentUser: null, token: null },
    questions: ['What place would you like to visit together?', 'What is a favorite memory we share?', 'What is something you love about me?', 'Where do you see us in 5 years?', 'What should we do next weekend?'],
    currentQuestion: 0,
    answeredQuestions: [],
    mood: { current: {}, customMoods: ['Happy', 'Relaxed', 'Tired', 'Sad', 'Excited'], selectedPerson: 'Gab', updatedAt: new Date().toISOString() },
    surprise: {}
  };

  var currentRoute = 'home';

  function save() {
    try { localStorage.setItem('gavvy-state', JSON.stringify(state)); } catch(e) {}
    if (window._supabaseReady && window.saveToSupabase) {
      window.saveToSupabase(state).catch(function(e) { console.log('save fail', e); });
    }
  }

  function load() {
    try {
      var s = localStorage.getItem('gavvy-state');
      if (s) {
        var p = JSON.parse(s);
        if (p.notes && p.notes.length > 0) state.notes = p.notes;
        if (p.trips && p.trips.length > 0) state.trips = p.trips;
        if (p.events && p.events.length > 0) state.events = p.events;
        if (p.memories && p.memories.length > 0) state.memories = p.memories;
        if (p.goals && p.goals.length > 0) state.goals = p.goals;
        if (p.answeredQuestions && p.answeredQuestions.length > 0) state.answeredQuestions = p.answeredQuestions;
        if (p.auth) state.auth = p.auth;
        if (p.couple) state.couple = p.couple;
        if (p.mood && p.mood.current) state.mood = p.mood;
      }
    } catch(e) {}
  }

  function loadFromCloud() {
    if (window._supabaseReady && window.loadFromSupabase) {
      var timeout = setTimeout(function() { console.log('cloud timeout'); }, 4000);
      window.loadFromSupabase(state).then(function() {
        clearTimeout(timeout);
        localStorage.setItem('gavvy-state', JSON.stringify(state));
        if (currentRoute !== 'login') navigate(currentRoute);
      }).catch(function(e) {
        clearTimeout(timeout);
        console.log('cloud fail', e);
      });
    }
  }

  load();
  if (!state.couple.startDate) { state.couple.startDate = '2025-07-09'; }
  if (!state.couple.name1) { state.couple.name1 = 'Gab'; }
  if (!state.couple.name2) { state.couple.name2 = 'Avi'; }
  loadFromCloud();

  function el(tag, cls, html) {
    try {
      var e = document.createElement(tag);
      if (cls) { e.className = cls; }
      if (html !== undefined) { e.innerHTML = html; }
      return e;
    } catch(e) { return document.createElement('div'); }
  }

  function esc(str) {
    if (!str) return '';
    var d = document.createElement('div');
    d.appendChild(document.createTextNode(String(str)));
    return d.innerHTML;
  }

  function navigate(route) {
    try {
      if (!state.auth.currentUser && route !== 'login') { route = 'login'; }
      if (state.auth.currentUser && route === 'login') { route = 'home'; }
      currentRoute = route;
      localStorage.setItem('gavvy-lastRoute', route);
      var app = document.getElementById('app');
      if (!app) return;
      app.innerHTML = '';
      var content = null;
      if (route === 'home') { content = document.createTextNode('HOME PAGE - Logged in as ' + (state.auth.currentUser ? state.auth.currentUser.username : 'none')); }
      else if (route === 'login') { content = renderLogin(); }
      else if (route === 'notes') { content = renderNotes(); }
      else if (route === 'us') { content = renderUs(); }
      else { content = renderHome(); }
      if (content) { app.appendChild(content); }
    } catch(e) {
      console.log('navigate error', e);
      var app = document.getElementById('app');
      if (app) { app.innerHTML = 'Error loading page. Check console. ' + e.message; }
    }
  }

  function renderLogin() {
    var root = el('div');
    root.innerHTML = '<div class="card" style="max-width:480px;margin:0 auto;text-align:center;padding:40px"><div class="label" style="font-size:1.5rem;margin-bottom:20px">GAVVY</div><h2 style="margin-bottom:24px">Select your profile</h2><div style="display:grid;gap:14px;max-width:200px;margin:0 auto"><button class="btn" id="loginGab" style="padding:14px;font-size:1.1rem">Gab</button><button class="btn btn-sec" id="loginAvi" style="padding:14px;font-size:1.1rem">Avi</button></div></div>';
    setTimeout(function() {
      var g = document.getElementById('loginGab');
      var a = document.getElementById('loginAvi');
      if (g) { g.onclick = function() { state.auth.currentUser = {username:'Gab'}; state.auth.token = 'Gab'; try { localStorage.setItem('gavvy-state', JSON.stringify(state)); } catch(e) {} navigate('home'); }; }
      if (a) { a.onclick = function() { state.auth.currentUser = {username:'Avi'}; state.auth.token = 'Avi'; try { localStorage.setItem('gavvy-state', JSON.stringify(state)); } catch(e) {} navigate('home'); }; }
    }, 100);
    return root;
  }

  function renderHome() {
    var root = el('div');
    root.innerHTML = '<div style="padding:20px;text-align:center"><div style="font-size:3rem;margin-bottom:8px">&#x2764;</div><h2>' + esc(state.couple.name1) + ' & ' + esc(state.couple.name2) + '</h2><p style="color:var(--secondary)">Welcome! Data syncs across all devices.</p><div style="margin-top:30px"><button class="btn" id="goNotes" style="margin:8px">Notes</button><button class="btn" id="goUs" style="margin:8px">Us</button></div></div>';
    setTimeout(function() {
      var n = document.getElementById('goNotes');
      var u = document.getElementById('goUs');
      if (n) n.onclick = function() { navigate('notes'); };
      if (u) u.onclick = function() { navigate('us'); };
    }, 50);
    return root;
  }

  function renderNotes() {
    var root = el('div');
    root.innerHTML = '<div style="padding:20px">';
    root.innerHTML += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px"><h2>Notes</h2><button class="btn" id="goHome" style="font-size:0.9rem;padding:8px 16px">Back</button></div>';
    root.innerHTML += '<div id="notesList" style="margin-bottom:20px"></div>';
    root.innerHTML += '<div class="card" style="padding:16px"><div class="label" style="margin-bottom:12px">Write a Note</div><input id="noteTitle" placeholder="Title" type="text" style="width:100%;padding:10px;margin-bottom:12px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:8px;color:var(--text)"><textarea id="noteBody" placeholder="Write your message..." style="width:100%;padding:10px;height:100px;margin-bottom:12px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:8px;color:var(--text)"></textarea><button class="btn" id="saveNoteBtn">Save Note</button></div></div>';

    function refreshNotes() {
      var nl = document.getElementById('notesList');
      if (!nl) return;
      var html = '';
      for (var i = state.notes.length - 1; i >= 0; i--) {
        var n = state.notes[i];
        html += '<div style="display:flex;justify-content:space-between;padding:12px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.1);border-radius:8px;margin-bottom:8px"><div><strong>' + esc(n.title) + '</strong><br><span style="color:var(--secondary);font-size:0.85rem">' + esc(n.date) + '</span><p style="margin:8px 0 0">' + esc(n.body) + '</p></div><button class="delNoteBtn" data-id="' + esc(n.id) + '" style="background:none;border:none;color:var(--accent);cursor:pointer;font-size:1.2rem">X</button></div>';
      }
      if (!html) { html = '<div style="color:var(--secondary);text-align:center;padding:24px">No notes yet.</div>'; }
      nl.innerHTML = html;
      nl.querySelectorAll('.delNoteBtn').forEach(function(b) {
        b.onclick = function() { state.notes = state.notes.filter(function(x) { return x.id !== b.dataset.id; }); save(); refreshNotes(); };
      });
    }

    setTimeout(function() {
      document.getElementById('goHome').onclick = function() { navigate('home'); };
      document.getElementById('saveNoteBtn').onclick = function() {
        var t = document.getElementById('noteTitle').value.trim();
        var b = document.getElementById('noteBody').value.trim();
        if (!b) return;
        state.notes.push({ id: Date.now().toString(), title: t || 'Untitled', body: b, date: new Date().toISOString().split('T')[0] });
        save();
        document.getElementById('noteTitle').value = '';
        document.getElementById('noteBody').value = '';
        refreshNotes();
      };
    }, 50);
    refreshNotes();
    return root;
  }

  function renderUs() {
    var root = el('div');
    var days = 0;
    if (state.couple.startDate) { days = Math.floor((new Date() - new Date(state.couple.startDate)) / 86400000); }
    var html = '<div style="padding:20px">';
    html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px"><h2>Us</h2><button class="btn" id="goHome" style="font-size:0.9rem;padding:8px 16px">Back</button></div>';
    html += '<div class="card" style="padding:16px;text-align:center;margin-bottom:16px"><div style="font-size:3rem;margin-bottom:8px">&#x1F491;</div><h3>' + esc(state.couple.name1) + ' & ' + esc(state.couple.name2) + '</h3><p>' + days + ' days together</p><div style="margin-top:8px"><button class="btn btn-sec btn-small" id="logoutBtn" style="padding:8px 16px">Logout</button></div></div>';
    html += '<div class="card" style="padding:16px;margin-bottom:16px"><div class="label" style="margin-bottom:12px">Goals</div>';
    if (state.goals.length === 0) { html += '<div style="color:var(--secondary);text-align:center;padding:12px">No goals yet</div>'; }
    else {
      for (var i = 0; i < state.goals.length; i++) {
        var g = state.goals[i];
        var p = Math.round((g.progress / g.target) * 100);
        html += '<div style="padding:8px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.1);border-radius:8px;margin-bottom:8px;display:flex;justify-content:space-between;align-items:center"><div><strong>' + esc(g.emoji) + ' ' + esc(g.title) + '</strong><br><span style="color:var(--secondary)">' + p + '% - ' + g.progress + '/' + g.target + '</span></div><button class="delGoalBtn" data-id="' + esc(g.id) + '" style="background:none;border:none;color:var(--accent);cursor:pointer">X</button></div>';
      }
    }
    html += '<button class="btn btn-small" id="showGoalForm" style="margin-top:12px">Add Goal</button>';
    html += '<div id="goalForm" style="display:none;margin-top:12px">';
    html += '<input id="goalEmoji" placeholder="Emoji" value="star" style="width:60px;padding:8px;margin-bottom:8px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:8px;color:var(--text)">';
    html += '<input id="goalTitle" placeholder="Title" type="text" style="width:100%;padding:8px;margin-bottom:8px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:8px;color:var(--text)">';
    html += '<input id="goalTarget" placeholder="Target" type="number" min="1" style="width:100%;padding:8px;margin-bottom:8px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:8px;color:var(--text)">';
    html += '<button class="btn btn-small" id="saveGoalBtn">Save</button></div></div>';
    html += '<div class="card" style="padding:16px"><div class="label" style="margin-bottom:12px">Our Conversations</div>';
    if (state.answeredQuestions.length === 0) { html += '<div style="color:var(--secondary);text-align:center;padding:12px">No conversations yet.</div>'; }
    else {
      for (var i = state.answeredQuestions.length - 1; i >= 0; i--) {
        var qa = state.answeredQuestions[i];
        html += '<div style="border-left:3px solid var(--accent);padding:12px;margin-bottom:8px;background:rgba(212,175,55,0.05);border-radius:4px"><div style="color:var(--secondary);font-size:0.85rem;margin-bottom:4px">' + esc(qa.date) + ' - ' + esc(qa.by) + '</div><div style="font-style:italic;margin-bottom:4px">Q: ' + esc(qa.question) + '</div><div>A: ' + esc(qa.answer) + '</div></div>';
      }
    }
    html += '</div></div>';
    root.innerHTML = html;

    setTimeout(function() {
      document.getElementById('goHome').onclick = function() { navigate('home'); };
      document.getElementById('logoutBtn').onclick = function() { state.auth.currentUser = null; state.auth.token = null; try { localStorage.setItem('gavvy-state', JSON.stringify(state)); } catch(e) {} navigate('login'); };
      document.getElementById('showGoalForm').onclick = function() { document.getElementById('goalForm').style.display = 'block'; };
      document.getElementById('saveGoalBtn').onclick = function() {
        var emoji = document.getElementById('goalEmoji').value.trim() || 'star';
        var title = document.getElementById('goalTitle').value.trim();
        var target = parseInt(document.getElementById('goalTarget').value, 10) || 100;
        if (!title) { alert('Enter a title'); return; }
        state.goals.push({ id: Date.now().toString(), emoji: emoji, title: title, type: 'count', progress: 0, target: target, deadline: null, milestones: [], items: [], createdAt: new Date().toISOString() });
        save();
        navigate('us');
      };
      document.querySelectorAll('.delGoalBtn').forEach(function(b) {
        b.onclick = function() { if (confirm('Delete this goal?')) { state.goals = state.goals.filter(function(g) { return g.id !== b.dataset.id; }); save(); navigate('us'); } };
      });
    }, 50);
    return root;
  }

  function init() {
    var ir = 'login';
    if (state.auth.currentUser) {
      var lr = localStorage.getItem('gavvy-lastRoute');
      if (lr && lr !== 'login') { ir = lr; } else { ir = 'home'; }
    }
    navigate(ir);
  }

  return { init: init };
})();

document.addEventListener('DOMContentLoaded', function() { GAVVY.init(); });
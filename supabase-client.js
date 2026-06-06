/**
 * Supabase Client - All data sync for "all devices see same data"
 */
const COUPLE_ID = '00000000-0000-0000-0000-000000000010';
const GAB_ID = '00000000-0000-0000-0000-000000000001';
const AVI_ID = '00000000-0000-0000-0000-000000000002';

const config = window.SUPABASE_CONFIG || {
    url: 'https://tdlsgxoiaxauswarjzjg.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkbHNneG9pYXhhdXN3YXJqempnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA0MDczNzYsImV4cCI6MjA5NTk4MzM3Nn0.FsrzIeojP3P1SwUuIglm9dmt8hJI8OF_MS8m9nv5v2E'
};

const { createClient } = supabase;
const supabaseClient = createClient(config.url, config.anonKey);
window.supabase = supabaseClient;

const supabaseConfigured = config.url !== 'https://your-project-id.supabase.co' &&
    config.anonKey !== 'your-anon-key-here';

async function loadFromSupabase(state) {
    if (!supabaseConfigured) return false;
    try {
        const sb = supabaseClient;
        const [coupleR, eventsR, memoriesR, notesR, listsR, tripsR, periodR, moodsR, answersR, qR, goalsR] = await Promise.all([
            sb.from('couples').select('*').eq('id', COUPLE_ID).maybeSingle(),
            sb.from('events').select('*').eq('couple_id', COUPLE_ID),
            sb.from('memories').select('*').eq('couple_id', COUPLE_ID),
            sb.from('notes').select('*').eq('couple_id', COUPLE_ID),
            sb.from('lists').select('*').eq('couple_id', COUPLE_ID),
            sb.from('trips').select('*').eq('couple_id', COUPLE_ID),
            sb.from('period_entries').select('*').eq('couple_id', COUPLE_ID),
            sb.from('mood_settings').select('*').eq('couple_id', COUPLE_ID),
            sb.from('answers').select('*').eq('couple_id', COUPLE_ID).order('created_at', { ascending: true }),
            sb.from('questions').select('*').eq('couple_id', COUPLE_ID).maybeSingle(),
            sb.from('goals').select('*').eq('couple_id', COUPLE_ID)
        ]);

        if (coupleR.data) {
            state.couple.name1 = coupleR.data.name1;
            state.couple.name2 = coupleR.data.name2;
            state.couple.startDate = coupleR.data.start_date;
        }
        if (eventsR.data && eventsR.data.length) {
            state.events = eventsR.data.map(e => ({ emoji: e.emoji, title: e.title, date: e.date }));
        }
        if (memoriesR.data && memoriesR.data.length) {
            state.memories = memoriesR.data.map(m => ({ emoji: m.emoji, title: m.title, story: m.story || m.text, location: m.location, date: m.date, image: m.image_url, category: m.category || 'photos' }));
        }
        if (notesR.data && notesR.data.length) {
            state.notes = notesR.data.map(n => ({ id: n.id, title: n.title, body: n.content, date: (n.created_at || '').split('T')[0] }));
        }
        if (tripsR.data && tripsR.data.length) {
            state.trips = tripsR.data.map(t => ({ name: t.name, budget: t.budget, spent: t.spent || 0, startDate: t.start_date, endDate: t.end_date, checklist: typeof t.checklist === 'string' ? JSON.parse(t.checklist) : (t.checklist || []), itinerary: typeof t.itinerary === 'string' ? JSON.parse(t.itinerary) : (t.itinerary || []) }));
        }
        if (periodR.data && periodR.data.length) {
            state.periodTracker.entries = periodR.data.map(p => ({ id: p.id, date: p.date, periodLength: p.period_length, flow: p.flow, symptoms: typeof p.symptoms === 'string' ? JSON.parse(p.symptoms) : (p.symptoms || []), note: p.note }));
            const sorted = [...state.periodTracker.entries].sort((a, b) => new Date(b.date) - new Date(a.date));
            state.periodTracker.lastPeriodDate = sorted[0].date;
            state.periodTracker.periodLength = sorted[0].periodLength;
        }
        if (listsR.data && listsR.data.length) {
            listsR.data.forEach(list => { state.lists[list.list_type] = typeof list.items === 'string' ? JSON.parse(list.items) : (list.items || []); });
        }
        if (moodsR.data && moodsR.data[0]) {
            state.mood.customMoods = typeof moodsR.data[0].custom_moods === 'string' ? JSON.parse(moodsR.data[0].custom_moods) : (moodsR.data[0].custom_moods || state.mood.customMoods);
            if (moodsR.data[0].mood_gab) state.mood.current[state.couple.name1 || 'Gab'] = moodsR.data[0].mood_gab;
            if (moodsR.data[0].mood_avi) state.mood.current[state.couple.name2 || 'Avi'] = moodsR.data[0].mood_avi;
            if (moodsR.data[0].selected_person) state.mood.selectedPerson = moodsR.data[0].selected_person;
        }
        if (answersR.data && answersR.data.length) {
            state.answeredQuestions = answersR.data.map(a => ({
                question: a.question_text,
                answer: a.answer,
                date: (a.created_at || '').split('T')[0],
                by: a.created_by || 'Gab'
            }));
        }
        if (qR.data) {
            state.currentQuestion = qR.data.current_index || 0;
        }
        // LOAD GOALS
        if (goalsR.data && goalsR.data.length) {
            state.goals = goalsR.data.map(g => ({
                id: g.id,
                emoji: g.emoji,
                title: g.title,
                type: g.type,
                progress: g.progress || 0,
                target: g.target,
                deadline: g.deadline || null,
                milestones: typeof g.milestones === 'string' ? JSON.parse(g.milestones) : (g.milestones || []),
                items: typeof g.items === 'string' ? JSON.parse(g.items) : (g.items || []),
                createdAt: g.created_at ? g.created_at.split('T')[0] : new Date().toISOString().split('T')[0]
            }));
        }
        return true;
    } catch (e) {
        console.error('[SUPABASE] Load error:', e.message);
        return false;
    }
}

async function saveToSupabase(state) {
    if (!supabaseConfigured) return false;
    const sb = supabaseClient;
    try {
        // Couple
        const { data: existingCouple } = await sb.from('couples').select('id').eq('id', COUPLE_ID).maybeSingle();
        if (existingCouple) {
            await sb.from('couples').update({ name1: state.couple.name1, name2: state.couple.name2, start_date: state.couple.startDate }).eq('id', COUPLE_ID);
        } else {
            await sb.from('couples').insert({ id: COUPLE_ID, user1_id: GAB_ID, user2_id: AVI_ID, name1: state.couple.name1, name2: state.couple.name2, start_date: state.couple.startDate });
        }

        // Each table is wrapped individually. Only delete+reinsert if we have data.
        // Events
        if (state.events && state.events.length > 0) {
            await sb.from('events').delete().eq('couple_id', COUPLE_ID);
            await sb.from('events').insert(state.events.map(e => ({ couple_id: COUPLE_ID, emoji: e.emoji || '🍽️', title: e.title, date: e.date })));
        }
        // Memories
        if (state.memories && state.memories.length > 0) {
            await sb.from('memories').delete().eq('couple_id', COUPLE_ID);
            await sb.from('memories').insert(state.memories.map(m => ({ couple_id: COUPLE_ID, title: m.title, story: m.story || m.text || '', emoji: m.emoji || '📸', image_url: m.image || null, location: m.location || null, date: m.date, category: m.category || 'photos' })));
        }
        // Notes - don't pass id (let Supabase auto-generate UUID), match by date+title
        if (state.notes && state.notes.length > 0) {
            await sb.from('notes').delete().eq('couple_id', COUPLE_ID);
            await sb.from('notes').insert(state.notes.map(n => ({ couple_id: COUPLE_ID, title: n.title || 'Untitled', content: n.body || '', created_by: GAB_ID, created_at: n.date ? n.date + 'T00:00:00' : new Date().toISOString() })));
        }
        // Lists
        for (const [listType, items] of Object.entries(state.lists)) {
            if (items && items.length > 0) {
                await sb.from('lists').delete().eq('couple_id', COUPLE_ID).eq('list_type', listType);
                await sb.from('lists').insert({ couple_id: COUPLE_ID, list_type: listType, items: JSON.stringify(items) });
            }
        }
        // Trips
        if (state.trips && state.trips.length > 0) {
            await sb.from('trips').delete().eq('couple_id', COUPLE_ID);
            await sb.from('trips').insert(state.trips.map(t => ({ couple_id: COUPLE_ID, name: t.name, budget: t.budget || 0, spent: t.spent || 0, checklist: JSON.stringify(t.checklist || []), itinerary: JSON.stringify(t.itinerary || []), start_date: t.startDate || null, end_date: t.endDate || null })));
        }
        // Period
        if (state.periodTracker.entries && state.periodTracker.entries.length > 0) {
            await sb.from('period_entries').delete().eq('couple_id', COUPLE_ID);
            await sb.from('period_entries').insert(state.periodTracker.entries.map(e => ({ couple_id: COUPLE_ID, user_id: GAB_ID, date: e.date, period_length: e.periodLength || e.period_length, flow: e.flow || 'normal', symptoms: JSON.stringify(e.symptoms || []), note: e.note || '' })));
        }
        // GOALS - NEW!
        if (state.goals && state.goals.length > 0) {
            await sb.from('goals').delete().eq('couple_id', COUPLE_ID);
            await sb.from('goals').insert(state.goals.map(g => ({
                id: g.id,
                couple_id: COUPLE_ID,
                emoji: g.emoji || '✨',
                title: g.title,
                type: g.type || 'count',
                progress: g.progress || 0,
                target: g.target || 100,
                deadline: g.deadline || null,
                milestones: JSON.stringify(g.milestones || []),
                items: JSON.stringify(g.items || []),
                created_at: g.createdAt ? g.createdAt + 'T00:00:00' : new Date().toISOString()
            })));
        }
        // Mood settings
        try {
            await sb.from('mood_settings').delete().eq('couple_id', COUPLE_ID);
            await sb.from('mood_settings').insert({
                couple_id: COUPLE_ID,
                custom_moods: JSON.stringify(state.mood.customMoods || ['😊 Happy', '😌 Relaxed', '😴 Tired', '😔 Sad', '🤩 Excited']),
                selected_person: state.mood.selectedPerson || state.couple.name1,
                mood_gab: state.mood.current[state.couple.name1] || null,
                mood_avi: state.mood.current[state.couple.name2] || null
            });
        } catch(e) { console.warn('[SUPABASE] Mood save:', e.message); }
        // Answers
        try {
            await sb.from('answers').delete().eq('couple_id', COUPLE_ID);
            if (state.answeredQuestions && state.answeredQuestions.length > 0) {
                await sb.from('answers').insert(state.answeredQuestions.map(a => ({
                    couple_id: COUPLE_ID,
                    question_id: '00000000-0000-0000-0000-000000000020',
                    question_text: a.question,
                    answer: a.answer,
                    created_by: a.by || 'Gab',
                    created_at: a.date ? a.date + 'T00:00:00' : new Date().toISOString()
                })));
            }
        } catch(e) { console.warn('[SUPABASE] Answers save:', e.message); }
        // Question index
        try {
            await sb.from('questions').delete().eq('couple_id', COUPLE_ID);
            await sb.from('questions').insert({ couple_id: COUPLE_ID, current_index: state.currentQuestion || 0 });
        } catch(e) { console.warn('[SUPABASE] Questions save:', e.message); }

        console.log('[SUPABASE] Save complete - goals:', state.goals.length, 'notes:', state.notes.length, 'trips:', state.trips.length);
        return true;
    } catch (e) {
        console.error('[SUPABASE] Save error:', e.message);
        return false;
    }
}

window._supabaseReady = supabaseConfigured;
window.loadFromSupabase = loadFromSupabase;
window.saveToSupabase = saveToSupabase;
window.COUPLE_ID = COUPLE_ID;

// Ensure default rows exist
if (supabaseConfigured) {
    supabaseClient.from('couples').select('count').eq('id', COUPLE_ID).then(r => {
        if (r.count === 0) {
            supabaseClient.from('couples').insert({ id: COUPLE_ID, user1_id: GAB_ID, user2_id: AVI_ID, name1: 'Gab', name2: 'Avi', start_date: '2025-07-09' }).catch(() => {});
            supabaseClient.from('questions').insert({ couple_id: COUPLE_ID, current_index: 0 }).catch(() => {});
        }
    }).catch(() => {});
}

console.log('[SUPABASE] Ready:', supabaseConfigured);
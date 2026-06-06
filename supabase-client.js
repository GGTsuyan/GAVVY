/**
 * Supabase Client - Fixed for "all devices see same data"
 * RLS is disabled and anon key has full access, so we use a fixed couple ID.
 * No auth needed. All data is shared across all devices/browsers instantly.
 */
const COUPLE_ID = '00000000-0000-0000-0000-000000000010';
const GAB_ID = '00000000-0000-0000-0000-000000000001';
const AVI_ID = '00000000-0000-0000-0000-000000000002';

console.log('[SUPABASE] Client loading...');

// Use config from supabase.config.js or fallback
const config = window.SUPABASE_CONFIG || {
    url: 'https://tdlsgxoiaxauswarjzjg.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkbHNneG9pYXhhdXN3YXJqempnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA0MDczNzYsImV4cCI6MjA5NTk4MzM3Nn0.FsrzIeojP3P1SwUuIglm9dmt8hJI8OF_MS8m9nv5v2E'
};

console.log('[SUPABASE] Config URL:', config.url.substring(0, 20) + '...');

// Check if Supabase JS client loaded
if (typeof supabase === 'undefined') {
    console.error('[SUPABASE] Supabase JS library not loaded! Check CDN script in HTML.');
} else {
    console.log('[SUPABASE] Supabase JS library found!');
}

const { createClient } = supabase;
const supabaseClient = createClient(config.url, config.anonKey, { debug: false });
window.supabase = supabaseClient;

// Check if Supabase is actually configured (URL not default)
const supabaseConfigured = config.url !== 'https://your-project-id.supabase.co' &&
    config.anonKey !== 'your-anon-key-here';

console.log('[SUPABASE] Configured:', supabaseConfigured);
console.log('[SUPABASE] Couple ID:', COUPLE_ID);

/**
 * Load all data from Supabase into a state object
 */
async function loadFromSupabase(state) {
    console.log('[SUPABASE] Loading data from cloud...');
    if (!supabaseConfigured) {
        console.warn('[SUPABASE] Not configured, skipping load');
        return false;
    }
    try {
        const sb = supabaseClient;
        console.log('[SUPABASE] Fetching all tables...');
        const [coupleR, eventsR, memoriesR, notesR, listsR, tripsR, periodR, moodsR] = await Promise.all([
            sb.from('couples').select('*').eq('id', COUPLE_ID).maybeSingle(),
            sb.from('events').select('*').eq('couple_id', COUPLE_ID),
            sb.from('memories').select('*').eq('couple_id', COUPLE_ID),
            sb.from('notes').select('*').eq('couple_id', COUPLE_ID),
            sb.from('lists').select('*').eq('couple_id', COUPLE_ID),
            sb.from('trips').select('*').eq('couple_id', COUPLE_ID),
            sb.from('period_entries').select('*').eq('couple_id', COUPLE_ID),
            sb.from('mood_settings').select('*').eq('couple_id', COUPLE_ID)
        ]);

        console.log('[SUPABASE] Load results:', { 
            couple: coupleR.data ? 'found' : 'not found', 
            events: eventsR.data?.length || 0, 
            memories: memoriesR.data?.length || 0, 
            notes: notesR.data?.length || 0,
            trips: tripsR.data?.length || 0,
            period: periodR.data?.length || 0,
            lists: listsR.data?.length || 0
        });

        if (coupleR.data) {
            state.couple.name1 = coupleR.data.name1;
            state.couple.name2 = coupleR.data.name2;
            state.couple.startDate = coupleR.data.start_date;
        }

        if (eventsR.data && eventsR.data.length) {
            state.events = eventsR.data.map(e => ({
                emoji: e.emoji,
                title: e.title,
                date: e.date
            }));
        }

        if (memoriesR.data && memoriesR.data.length) {
            state.memories = memoriesR.data.map(m => ({
                emoji: m.emoji,
                title: m.title,
                story: m.story || m.text,
                location: m.location,
                date: m.date,
                image: m.image_url,
                category: m.category || 'photos'
            }));
        }

        if (notesR.data && notesR.data.length) {
            state.notes = notesR.data.map(n => ({
                id: n.id,
                title: n.title,
                body: n.content,
                date: (n.created_at || '').split('T')[0]
            }));
        }

        if (tripsR.data && tripsR.data.length) {
            state.trips = tripsR.data.map(t => ({
                name: t.name,
                budget: t.budget,
                spent: t.spent || 0,
                startDate: t.start_date,
                endDate: t.end_date,
                checklist: typeof t.checklist === 'string' ? JSON.parse(t.checklist) : (t.checklist || []),
                itinerary: typeof t.itinerary === 'string' ? JSON.parse(t.itinerary) : (t.itinerary || [])
            }));
        }

        if (periodR.data && periodR.data.length) {
            state.periodTracker.entries = periodR.data.map(p => ({
                id: p.id,
                date: p.date,
                periodLength: p.period_length,
                flow: p.flow,
                symptoms: typeof p.symptoms === 'string' ? JSON.parse(p.symptoms) : (p.symptoms || []),
                note: p.note
            }));
            const sorted = [...state.periodTracker.entries].sort((a, b) => new Date(b.date) - new Date(a.date));
            state.periodTracker.lastPeriodDate = sorted[0].date;
            state.periodTracker.periodLength = sorted[0].periodLength;
        }

        if (listsR.data && listsR.data.length) {
            listsR.data.forEach(list => {
                state.lists[list.list_type] = typeof list.items === 'string' ? JSON.parse(list.items) : (list.items || []);
            });
        }

        if (moodsR.data && moodsR.data[0]) {
            state.mood.customMoods = typeof moodsR.data[0].custom_moods === 'string'
                ? JSON.parse(moodsR.data[0].custom_moods)
                : (moodsR.data[0].custom_moods || state.mood.customMoods);
        }

        console.log('[SUPABASE] Load complete!');
        return true;
    } catch (e) {
        console.error('[SUPABASE] Load error:', e.message);
        return false;
    }
}

/**
 * Save all data from a state object to Supabase
 */
async function saveToSupabase(state) {
    if (!supabaseConfigured) {
        console.warn('[SUPABASE] Not configured, skipping save');
        return false;
    }
    const sb = supabaseClient;
    try {
        console.log('[SUPABASE] Saving data... Current events count:', state.events.length);
        
        // Upsert couple - FIRST ensure the row exists
        const { data: existingCouple } = await sb.from('couples').select('id').eq('id', COUPLE_ID).maybeSingle();
        if (existingCouple) {
            await sb.from('couples').update({
                name1: state.couple.name1,
                name2: state.couple.name2,
                start_date: state.couple.startDate
            }).eq('id', COUPLE_ID);
        } else {
            const { error: insertErr } = await sb.from('couples').insert({
                id: COUPLE_ID,
                user1_id: GAB_ID,
                user2_id: AVI_ID,
                name1: state.couple.name1,
                name2: state.couple.name2,
                start_date: state.couple.startDate
            });
            if (insertErr) console.error('[SUPABASE] Failed to insert couple:', insertErr.message);
        }

        // Sync events
        await sb.from('events').delete().eq('couple_id', COUPLE_ID);
        if (state.events.length > 0) {
            const { error: eventsErr } = await sb.from('events').insert(
                state.events.map(e => ({
                    couple_id: COUPLE_ID,
                    emoji: e.emoji || '🍽️',
                    title: e.title,
                    date: e.date
                }))
            );
            if (eventsErr) {
                console.error('[SUPABASE] Events insert error:', eventsErr.message);
            } else {
                console.log('[SUPABASE] Saved', state.events.length, 'events successfully');
            }
        }

        // Sync memories
        await sb.from('memories').delete().eq('couple_id', COUPLE_ID);
        if (state.memories.length > 0) {
            await sb.from('memories').insert(
                state.memories.map(m => ({
                    couple_id: COUPLE_ID,
                    title: m.title,
                    story: m.story || m.text || '',
                    emoji: m.emoji || '📸',
                    image_url: m.image || null,
                    location: m.location || null,
                    date: m.date,
                    category: m.category || 'photos'
                }))
            );
        }

        // Sync notes
        await sb.from('notes').delete().eq('couple_id', COUPLE_ID);
        if (state.notes.length > 0) {
            await sb.from('notes').insert(
                state.notes.map(n => ({
                    id: n.id,
                    couple_id: COUPLE_ID,
                    title: n.title || 'Untitled',
                    content: n.body || '',
                    created_by: GAB_ID,
                    created_at: n.date ? n.date + 'T00:00:00' : new Date().toISOString()
                }))
            );
        }

        // Sync lists
        for (const [listType, items] of Object.entries(state.lists)) {
            await sb.from('lists').delete().eq('couple_id', COUPLE_ID).eq('list_type', listType);
            if (items.length > 0) {
                await sb.from('lists').insert({
                    couple_id: COUPLE_ID,
                    list_type: listType,
                    items: typeof items === 'string' ? items : JSON.stringify(items)
                });
            }
        }

        // Sync trips
        await sb.from('trips').delete().eq('couple_id', COUPLE_ID);
        if (state.trips.length > 0) {
            await sb.from('trips').insert(
                state.trips.map(t => ({
                    couple_id: COUPLE_ID,
                    name: t.name,
                    budget: t.budget || 0,
                    spent: t.spent || 0,
                    checklist: JSON.stringify(t.checklist || []),
                    itinerary: JSON.stringify(t.itinerary || []),
                    start_date: t.startDate || null,
                    end_date: t.endDate || null
                }))
            );
        }

        // Sync period entries
        await sb.from('period_entries').delete().eq('couple_id', COUPLE_ID);
        if (state.periodTracker.entries.length > 0) {
            await sb.from('period_entries').insert(
                state.periodTracker.entries.map(e => ({
                    couple_id: COUPLE_ID,
                    user_id: GAB_ID,
                    date: e.date,
                    period_length: e.periodLength || e.period_length,
                    flow: e.flow || 'normal',
                    symptoms: JSON.stringify(e.symptoms || []),
                    note: e.note || ''
                }))
            );
        }

        // Sync mood settings
        await sb.from('mood_settings').delete().eq('couple_id', COUPLE_ID);
        await sb.from('mood_settings').insert({
            couple_id: COUPLE_ID,
            custom_moods: JSON.stringify(state.mood.customMoods || ['😊 Happy', '😌 Relaxed', '😴 Tired', '😔 Sad', '🤩 Excited']),
            selected_person: state.mood.selectedPerson || state.couple.name1
        });

        console.log('[SUPABASE] FULL SAVE COMPLETE');
        return true;
    } catch (e) {
        console.error('[SUPABASE] Save error:', e.message, e.stack);
        return false;
    }
}

// Make functions available globally
window._supabaseReady = supabaseConfigured;
window.loadFromSupabase = loadFromSupabase;
window.saveToSupabase = saveToSupabase;
window.COUPLE_ID = COUPLE_ID;

// Auto-initialize: check if existing data exists in Supabase
if (supabaseConfigured) {
    supabaseClient.from('couples').select('count').eq('id', COUPLE_ID).then(r => {
        console.log('[SUPABASE] Couple row exists:', r.count > 0);
        if (r.count === 0) {
            // Insert the default couple row
            supabaseClient.from('couples').insert({
                id: COUPLE_ID,
                user1_id: GAB_ID,
                user2_id: AVI_ID,
                name1: 'Gab',
                name2: 'Avi',
                start_date: '2025-07-09'
            }).then(() => console.log('[SUPABASE] Default couple row created'))
            .catch(e => console.error('[SUPABASE] Failed to create couple row:', e.message));
        }
    }).catch(e => console.warn('[SUPABASE] Initial check failed:', e.message));
}

console.log('[SUPABASE] Client fully loaded. Ready:', supabaseConfigured);
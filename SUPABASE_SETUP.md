# Supabase Integration Guide for Love Website Generator

This guide will walk you through setting up Supabase as the database backend for your love website generator, replacing localStorage and the Python Flask backend.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Step 1: Create a Supabase Project](#step-1-create-a-supabase-project)
3. [Step 2: Set Up the Database Schema](#step-2-set-up-the-database-schema)
4. [Step 3: Configure Storage](#step-3-configure-storage)
5. [Step 4: Get Your API Keys](#step-4-get-your-api-keys)
6. [Step 5: Update Your Project Configuration](#step-5-update-your-project-configuration)
7. [Step 6: Update HTML Files](#step-6-update-html-files)
8. [Step 7: Migrate Existing Data](#step-7-migrate-existing-data)
9. [Step 8: Test the Integration](#step-8-test-the-integration)
10. [API Reference](#api-reference)
11. [Troubleshooting](#troubleshooting)

---

## Prerequisites

- A Supabase account (sign up at [supabase.com](https://supabase.com))
- Basic understanding of JavaScript
- Your existing love website generator project

---

## Step 1: Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click **"New Project"**
3. Fill in the project details:
   - **Name**: `love-website-generator` (or your preferred name)
   - **Database Password**: Choose a strong password (save it securely!)
   - **Region**: Choose the region closest to your users
4. Click **"Create new project"**
5. Wait for the project to be provisioned (takes about 2 minutes)

---

## Step 2: Set Up the Database Schema

1. In your Supabase project dashboard, go to **SQL Editor** (left sidebar)
2. Click **"New query"**
3. Copy and paste the contents of `supabase-schema.sql` into the editor
4. Click **"Run"** to execute the SQL

This will create all the necessary tables, indexes, security policies, and triggers for your application.

### Tables Created:

| Table | Description |
|-------|-------------|
| `profiles` | User profiles (extends Supabase auth) |
| `couples` | Couple relationships |
| `memories` | Photos and memories |
| `events` | Calendar events |
| `goals` | Savings/count/list goals |
| `notes` | Love notes |
| `lists` | Shared lists (travel, movies, etc.) |
| `moods` | Mood tracking entries |
| `mood_settings` | Custom mood options |
| `period_entries` | Period tracking data |
| `questions` | Daily questions for couples |
| `answers` | Question answers |
| `surprises` | Locked surprise messages |

---

## Step 3: Configure Storage

Supabase Storage is used to store images (memory photos, profile avatars).

### Create Storage Buckets:

1. Go to **Storage** in the left sidebar
2. Click **"New bucket"**
3. Create the following buckets:

#### Bucket 1: `memory-photos`
- **Name**: `memory-photos`
- **Public**: ✅ Yes (public bucket)
- **File size limit**: Leave empty (no limit)
- Click **"Save"**

#### Bucket 2: `profile-avatars`
- **Name**: `profile-avatars`
- **Public**: ✅ Yes (public bucket)
- **File size limit**: Leave empty (no limit)
- Click **"Save"**

### Configure Storage Policies:

1. Click on the `memory-photos` bucket
2. Go to the **Policies** tab
3. Click **"New policy"** and add these policies:

**Policy 1: Allow public viewing**
```sql
CREATE POLICY "Anyone can view memory photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'memory-photos');
```

**Policy 2: Allow authenticated uploads**
```sql
CREATE POLICY "Authenticated users can upload memory photos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'memory-photos' AND auth.role() = 'authenticated');
```

**Policy 3: Allow users to delete their uploads**
```sql
CREATE POLICY "Users can delete their own memory photos"
ON storage.objects FOR DELETE
USING (bucket_id = 'memory-photos' AND auth.role() = 'authenticated');
```

4. Repeat the same policies for the `profile-avatars` bucket (changing `bucket_id` accordingly)

---

## Step 4: Get Your API Keys

1. Go to **Settings** (gear icon in left sidebar)
2. Click **"API"**
3. You'll see your project credentials:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon/public key**: A long string starting with `eyJ...`

**⚠️ Important**: 
- The `anon` key is safe to use in client-side code (it's public)
- Never expose the `service_role` key in client-side code!

---

## Step 5: Update Your Project Configuration

### Option A: Environment Variables (Recommended for Production)

Create a `.env` file in your project root:

```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
```

### Option B: Direct Configuration

Update `supabase-client.js` with your credentials:

```javascript
const SUPABASE_CONFIG = {
    url: 'https://your-project-id.supabase.co',
    anonKey: 'your-anon-key-here'
};
```

### Create Environment-Specific Config:

Create `supabase.config.js`:

```javascript
// supabase.config.js
const SUPABASE_CONFIG = {
    url: 'https://your-project-id.supabase.co',
    anonKey: 'your-anon-key-here'
};

// Make available globally
window.SUPABASE_CONFIG = SUPABASE_CONFIG;
```

---

## Step 6: Update HTML Files

Add the Supabase JavaScript client to your HTML files. In `index.html`, add these scripts before your other JavaScript files:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <!-- Your existing head content -->
    
    <!-- Supabase JS Client -->
    <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
</head>
<body>
    <!-- Your existing HTML content -->
    
    <!-- Configuration -->
    <script src="supabase.config.js"></script>
    
    <!-- Database Service Layer -->
    <script src="supabase-client.js"></script>
    
    <!-- Your existing scripts -->
    <script src="script.js"></script>
    <script src="main.js"></script>
</body>
</html>
```

---

## Step 7: Migrate Existing Data

If you have existing data in localStorage, you can migrate it to Supabase.

### Migration Script:

Create `migrate-to-supabase.js`:

```javascript
/**
 * Migration Script: localStorage to Supabase
 * Run this once to migrate existing data
 */

async function migrateToSupabase() {
    console.log('Starting migration to Supabase...');
    
    try {
        // Get existing state from localStorage
        const savedState = localStorage.getItem('gavvy-state');
        if (!savedState) {
            console.log('No existing data found in localStorage.');
            return;
        }
        
        const state = JSON.parse(savedState);
        
        // Wait for Supabase client to initialize
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Sign in or create account for migration
        // You'll need to handle authentication first
        const session = await DatabaseService.getSession();
        if (!session) {
            console.log('Please sign in to migrate data.');
            return;
        }
        
        const userId = session.user.id;
        let couple = await DatabaseService.getCoupleByUserId(userId);
        
        if (!couple) {
            // Create couple if doesn't exist
            couple = await DatabaseService.createCouple(
                userId,
                userId, // For single-user migration, same user
                state.couple.name1,
                state.couple.name2,
                state.couple.startDate
            );
        }
        
        const coupleId = couple.id;
        
        // Migrate memories
        if (state.memories && state.memories.length > 0) {
            for (const memory of state.memories) {
                await DatabaseService.addMemory(coupleId, memory);
            }
            console.log(`Migrated ${state.memories.length} memories.`);
        }
        
        // Migrate events
        if (state.events && state.events.length > 0) {
            for (const event of state.events) {
                await DatabaseService.addEvent(coupleId, event);
            }
            console.log(`Migrated ${state.events.length} events.`);
        }
        
        // Migrate goals
        if (state.goals && state.goals.length > 0) {
            for (const goal of state.goals) {
                await DatabaseService.addGoal(coupleId, goal);
            }
            console.log(`Migrated ${state.goals.length} goals.`);
        }
        
        // Migrate lists
        if (state.lists) {
            for (const [listType, items] of Object.entries(state.lists)) {
                await DatabaseService.upsertList(coupleId, listType, items);
            }
            console.log('Migrated lists.');
        }
        
        // Migrate mood settings
        if (state.mood && state.mood.customMoods) {
            await DatabaseService.updateMoodSettings(coupleId, state.mood.customMoods);
            console.log('Migrated mood settings.');
        }
        
        // Clear localStorage after successful migration
        // localStorage.removeItem('gavvy-state');
        
        console.log('Migration completed successfully!');
        
    } catch (error) {
        console.error('Migration error:', error);
    }
}

// Run migration when page loads (uncomment to enable)
// document.addEventListener('DOMContentLoaded', migrateToSupabase);
```

---

## Step 8: Test the Integration

### Test Authentication:

```javascript
// Test sign up
const { data, error } = await DatabaseService.signUp('test@example.com', 'password123');
console.log(data, error);

// Test sign in
const { data: session } = await DatabaseService.signIn('test@example.com', 'password123');
console.log(session);
```

### Test Data Operations:

```javascript
// Initialize state manager
await stateManager.init();

// Test saving
stateManager.state.couple.name1 = 'Test';
await stateManager.save();

// Test reading
const memories = await DatabaseService.getMemories(stateManager.coupleId);
console.log(memories);
```

---

## API Reference

### Authentication

```javascript
// Sign up
await DatabaseService.signUp(email, password, metadata);

// Sign in
await DatabaseService.signIn(email, password);

// Sign out
await DatabaseService.signOut();

// Get current session
const session = await DatabaseService.getSession();

// Get current user
const user = await DatabaseService.getCurrentUser();

// Listen to auth changes
DatabaseService.onAuthStateChange((event, session) => {
    console.log(event, session);
});
```

### Memories

```javascript
// Add memory
await DatabaseService.addMemory(coupleId, {
    title: 'Our First Date',
    story: 'We went to...',
    emoji: '📸',
    image_url: 'https://...',
    location: 'Restaurant Name',
    date: '2024-02-14',
    category: 'photos'
});

// Get memories
const memories = await DatabaseService.getMemories(coupleId);

// Update memory
await DatabaseService.updateMemory(memoryId, { title: 'Updated Title' });

// Delete memory
await DatabaseService.deleteMemory(memoryId);
```

### Events

```javascript
// Add event
await DatabaseService.addEvent(coupleId, {
    title: 'Anniversary Dinner',
    emoji: '🍽️',
    date: '2024-07-09'
});

// Get events
const events = await DatabaseService.getEvents(coupleId);
```

### Goals

```javascript
// Add goal
await DatabaseService.addGoal(coupleId, {
    emoji: '✈️',
    title: 'Japan Trip',
    type: 'savings', // 'savings', 'count', or 'list'
    progress: 0,
    target: 50000,
    deadline: '2025-12-31',
    milestones: [
        { value: 10000, label: '₱10k', reward: '🎯 Dreamer' }
    ]
});

// Get goals
const goals = await DatabaseService.getGoals(coupleId);

// Update goal progress
await DatabaseService.updateGoal(goalId, { progress: 15000 });
```

### Lists

```javascript
// Update list
await DatabaseService.upsertList(coupleId, 'travelList', [
    { text: 'Japan', checked: false },
    { text: 'Paris', checked: true }
]);

// Get list
const travelList = await DatabaseService.getList(coupleId, 'travelList');
```

### Moods

```javascript
// Record mood
await DatabaseService.recordMood(coupleId, userId, '😊 Happy');

// Get latest moods
const moods = await DatabaseService.getLatestMoods(coupleId);
```

### File Upload

```javascript
// Upload file
const fileUrl = await DatabaseService.uploadFile(file, 'memory-photos');
```

---

## Troubleshooting

### Common Issues

#### 1. "Invalid API key" error
- Double-check your `SUPABASE_URL` and `SUPABASE_ANON_KEY`
- Make sure you're using the `anon` key, not `service_role`

#### 2. "Permission denied" errors
- Check that RLS policies are properly configured
- Ensure the user is authenticated before accessing data

#### 3. "Relation not found" errors
- Make sure you've run the `supabase-schema.sql` script
- Check that all tables were created successfully

#### 4. Storage upload fails
- Verify storage buckets exist and are public
- Check storage policies are configured correctly

### Debug Mode

Add this to your code to see detailed logs:

```javascript
const supabaseClient = createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey, {
    debug: true
});
```

### Testing RLS Policies

In Supabase SQL Editor, test your policies:

```sql
-- Test as a specific user
SET request.jwt.claims.sub = 'user-uuid-here';

-- Now run your queries to see if they work
SELECT * FROM memories;
```

---

## Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/introduction)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Storage Guide](https://supabase.com/docs/guides/storage)

---

## Support

If you encounter any issues:
1. Check the [Supabase Discord](https://discord.supabase.com)
2. Search [Stack Overflow](https://stackoverflow.com/questions/tagged/supabase)
3. Review [Supabase GitHub Issues](https://github.com/supabase/supabase/issues)
/**
 * Supabase Configuration
 * 
 * Update these values with your Supabase project credentials.
 * Get these from: Supabase Dashboard > Settings > API
 */

const SUPABASE_CONFIG = {
    // Your Supabase project URL
    // Format: https://your-project-id.supabase.co
    url: 'https://your-project-id.supabase.co',
    
    // Your Supabase anon/public key
    // This key is safe to use in client-side code
    anonKey: 'your-anon-key-here'
};

// Make configuration available globally
window.SUPABASE_CONFIG = SUPABASE_CONFIG;

// Export for module-based usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SUPABASE_CONFIG;
}
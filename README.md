# 💕 Love Website Generator

A beautiful, customizable love website generator that creates romantic websites for couples. Perfect for anniversaries, Valentine's Day, or just to show your love!

![Love Website Generator](https://img.shields.io/badge/Love-Website%20Generator-pink?style=for-the-badge&logo=heart)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)
![Version](https://img.shields.io/badge/Version-2.0.0-blue?style=for-the-badge)
![Database](https://img.shields.io/badge/Database-Supabase-green?style=for-the-badge)

## ✨ Features

- 💖 **Beautiful Design**: Elegant, romantic design with floating hearts and animations
- 🎵 **Background Music**: Optional romantic background music
- 💋 **Interactive Elements**: Kiss counter, love meter, and interactive memory cards
- 📱 **Responsive**: Works perfectly on desktop, tablet, and mobile devices
- 🎨 **Customizable**: Easy to personalize with your partner's name and messages
- 🌟 **Special Effects**: Heart bursts, sparkles, and romantic animations
- 💝 **Love Notes**: Hidden love messages that appear on click
- 🎮 **Mini Games**: Fun interactive elements to engage your partner
- 🗄️ **Cloud Database**: Supabase integration for persistent storage and multi-device sync
- 👥 **Multi-User Support**: Both partners can access and update shared data
- 📊 **Rich Features**: Goals tracking, mood check-ins, period tracker, shared lists, and more

## 🚀 Quick Start

### Basic Setup (No Database)

1. **Download or Clone** this repository
2. **Open** `config.js` and customize it with your information
3. **Open** `index.html` in your web browser
4. **Share** the love with your partner! 💕

### With Supabase Database (Recommended for Couples)

1. **Set up Supabase** - Follow the [Supabase Setup Guide](SUPABASE_SETUP.md)
2. **Configure** `supabase.config.js` with your Supabase credentials
3. **Run the SQL schema** in `supabase-schema.sql` on your Supabase project
4. **Update** `index.html` to include the Supabase scripts
5. **Sign up/Sign in** and enjoy cloud-synced data across devices!

## 📝 Customization

### Basic Setup

Edit the `config.js` file to personalize your love website:

```javascript
const CONFIG = {
    // Your partner's name (will be used throughout the website)
    partnerName: "Your Love's Name",
    
    // Your name (optional, for signature)
    yourName: "Your Name",
    
    // Custom messages
    messages: {
        subtitle: "you light up my world in ways words can't express ✨",
        loveNote: "your personalized love message here...",
        // ... more customizable messages
    }
};
```

### What You Can Customize

- **Names**: Partner's name and your name
- **Messages**: Love notes, special messages, and descriptions
- **Memories**: Customize memory descriptions and messages
- **Character Descriptions**: Personalize how you describe each other
- **Kiss Messages**: Special messages for different kiss counts
- **Interactive Messages**: Messages that appear when clicking characters

## 🎨 Features Overview

### 💕 Interactive Love Section
- Click the love button to reveal a hidden love note
- Beautiful heart burst animation
- Customizable love message

### 🎮 Kiss Counter Game
- Send virtual kisses to your partner
- Special messages at 10, 50, and 100 kisses
- Animated kiss effects

### 💫 Memory Gallery
- Three interactive memory cards
- Click to see special effects and messages
- Customizable memory descriptions

### ❤️ Love Meter
- Shows infinite love (∞%)
- Animated love meter
- Beautiful gradient design

### 🎵 Background Music
- Optional romantic background music
- Music toggle button
- Multiple audio sources for compatibility

## 🛠️ Technical Details

### Built With
- **HTML5**: Semantic markup and modern features
- **CSS3**: Beautiful animations, gradients, and responsive design
- **JavaScript**: Interactive features and dynamic content
- **Google Fonts**: Elegant typography (Great Vibes, Cormorant Garamond, etc.)
- **Supabase**: PostgreSQL database, authentication, and file storage

### Browser Support
- ✅ Chrome (recommended)
- ✅ Firefox
- ✅ Safari
- ✅ Edge
- ✅ Mobile browsers

### Performance
- Optimized animations with `will-change` property
- Efficient event handling
- Minimal dependencies
- Fast loading times

## 📱 Mobile Optimization

The website is fully responsive and optimized for mobile devices:
- Touch-friendly buttons and interactions
- Optimized animations for mobile performance
- Responsive typography and layouts
- Mobile-specific CSS optimizations

## 🎯 Use Cases

Perfect for:
- **Anniversaries**: Celebrate your relationship milestones
- **Valentine's Day**: Create a special Valentine's gift
- **Birthdays**: Surprise your partner with a personalized website
- **Long Distance**: Share love across the miles
- **Proposals**: Create a romantic backdrop for your proposal
- **Just Because**: Show your love any day of the year

## 🌟 Examples

### For Anniversaries
- Customize messages to reflect your journey together
- Add specific memories and milestones
- Include your anniversary date in messages

### For Valentine's Day
- Use romantic Valentine's themes
- Add heart-filled messages
- Create a special Valentine's surprise

### For Long Distance Relationships
- Include messages about missing each other
- Add countdown timers to your next meeting
- Share virtual kisses and love

## 🗄️ Database & Supabase Integration

Version 2.0 introduces full Supabase integration for persistent data storage:

### Features with Database
- **👥 User Authentication**: Secure sign up and login
- **💾 Cloud Storage**: All data synced across devices
- **👫 Couple Profiles**: Shared data between partners
- **📸 Memory Gallery**: Store photos and stories in the cloud
- **📅 Shared Calendar**: Events and anniversaries synced
- **🎯 Goals Tracking**: Savings goals, challenges, and milestones
- **😊 Mood Check-ins**: Track and share moods
- **📝 Shared Lists**: Travel bucket lists, date ideas, movies, restaurants
- **💌 Love Notes**: Persistent notes between partners
- **🩸 Period Tracker**: Private health tracking
- **💬 Daily Questions**: Answer questions and save responses
- **🎁 Surprise Messages**: Time-locked messages for special occasions

### Quick Database Setup
1. Create a free Supabase account at [supabase.com](https://supabase.com)
2. Create a new project
3. Run the SQL schema from `supabase-schema.sql`
4. Update `supabase.config.js` with your project credentials
5. Include the Supabase scripts in your HTML

📖 **Full setup instructions**: See [SUPABASE_SETUP.md](SUPABASE_SETUP.md)

## 🤝 Contributing

We welcome contributions! Here's how you can help:

1. **Fork** the repository
2. **Create** a feature branch
3. **Make** your changes
4. **Test** thoroughly
5. **Submit** a pull request

### Ideas for Contributions
- New interactive features
- Additional customization options
- New themes and color schemes
- Performance improvements
- Mobile optimizations
- Accessibility improvements
- New database features

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 💝 Support

If you love this project and want to support it:
- ⭐ Star the repository
- 🐛 Report bugs
- 💡 Suggest new features
- 📢 Share with others

## 🎉 Acknowledgments

- Inspired by love and romance
- Built with modern web technologies
- Designed for couples everywhere
- Made with ❤️ for the community

## 📞 Contact

Have questions or suggestions? We'd love to hear from you!

- **GitHub Issues**: [Report bugs or request features](https://github.com/yourusername/love-website-generator/issues)
- **Discussions**: [Join the conversation](https://github.com/yourusername/love-website-generator/discussions)

---

**Made with 💕 for couples everywhere**

*Spread the love and share this project with others who might enjoy it!*

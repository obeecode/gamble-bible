import axios from 'axios';

// Configuration
const API_BASE_URL = process.env.API_URL || 'http://localhost:4000/api';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@example.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

// Types
interface ContentSection {
  id: string;
  type: 'text' | 'heading' | 'image';
  content: string;
  imageUrl?: string;
  imageAlt?: string;
}

interface BlogData {
  title: string;
  category: string;
  tags: string[];
  sections: ContentSection[];
  coverImage?: string;
  seoDescription?: string;
  status: 'draft' | 'published';
}

// Blog seed data
const blogTemplates: Omit<BlogData, 'category'>[] = [
  {
    title: 'The Ultimate Guide to Online Casino Bonuses in 2024',
    tags: ['casino', 'bonuses', 'online gambling', 'guide'],
    seoDescription: 'Discover everything you need to know about online casino bonuses, from welcome offers to loyalty programs. Learn how to maximize your winnings.',
    status: 'published',
    coverImage: 'https://images.unsplash.com/photo-1529419412599-7bb870e11810?q=80&w=987&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    sections: [
      {
        id: '1',
        type: 'heading',
        content: 'Introduction to Casino Bonuses'
      },
      {
        id: '2',
        type: 'text',
        content: 'Online casino bonuses have become an essential part of the gambling experience. Whether you\'re a new player or a seasoned veteran, understanding how bonuses work can significantly enhance your gaming journey. In this comprehensive guide, we\'ll explore the different types of bonuses available, how to claim them, and strategies to make the most of your bonus offers.'
      },
      {
        id: '3',
        type: 'heading',
        content: 'Types of Casino Bonuses'
      },
      {
        id: '4',
        type: 'text',
        content: 'The most common types of casino bonuses include welcome bonuses, no-deposit bonuses, free spins, reload bonuses, and cashback offers. Each type serves a different purpose and comes with its own set of terms and conditions. Welcome bonuses are typically the most generous, designed to attract new players to the platform.'
      },
      {
        id: '5',
        type: 'heading',
        content: 'Understanding Wagering Requirements'
      },
      {
        id: '6',
        type: 'text',
        content: 'Wagering requirements are crucial to understand before accepting any bonus. These requirements determine how many times you must bet the bonus amount before you can withdraw your winnings. Always read the terms and conditions carefully to avoid any surprises.'
      }
    ]
  },
  {
    title: 'Top 10 Slot Games with the Best RTP in 2024',
    tags: ['slots', 'RTP', 'best games', 'casino games'],
    seoDescription: 'Explore the top slot games with the highest Return to Player percentages. Find the best slots for maximizing your winning potential.',
    status: 'published',
    coverImage: 'https://images.unsplash.com/photo-1529419412599-7bb870e11810?q=80&w=987&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    sections: [
      {
        id: '1',
        type: 'heading',
        content: 'What is RTP?'
      },
      {
        id: '2',
        type: 'text',
        content: 'Return to Player (RTP) is a percentage that indicates how much of the total wagered money a slot game will pay back to players over time. For example, a slot with 96% RTP will return $96 for every $100 wagered, on average. Higher RTP means better long-term value for players.'
      },
      {
        id: '3',
        type: 'heading',
        content: 'Top RTP Slot Games'
      },
      {
        id: '4',
        type: 'text',
        content: 'Some of the highest RTP slots include games like Mega Joker (99%), Ooh Aah Dracula (99%), and 1429 Uncharted Seas (98.6%). These games offer players the best mathematical advantage, though they may have lower volatility compared to high-variance slots.'
      }
    ]
  },
  {
    title: 'Blackjack Strategy: How to Beat the House Edge',
    tags: ['blackjack', 'strategy', 'card games', 'tips'],
    seoDescription: 'Master blackjack with proven strategies that can reduce the house edge. Learn basic strategy, card counting, and advanced techniques.',
    status: 'published',
    coverImage: 'https://images.unsplash.com/photo-1529419412599-7bb870e11810?q=80&w=987&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    sections: [
      {
        id: '1',
        type: 'heading',
        content: 'Basic Blackjack Strategy'
      },
      {
        id: '2',
        type: 'text',
        content: 'Blackjack is one of the few casino games where skill and strategy can significantly impact your results. By following basic strategy charts, players can reduce the house edge to less than 1%. The strategy involves making mathematically optimal decisions based on your hand and the dealer\'s upcard.'
      },
      {
        id: '3',
        type: 'heading',
        content: 'When to Hit, Stand, Double, or Split'
      },
      {
        id: '4',
        type: 'text',
        content: 'The fundamental rules are straightforward: always stand on 17 or higher, hit on 11 or lower, and double down on 11 when the dealer shows 2-10. Splitting pairs of 8s and Aces is almost always recommended, while never split 10s or face cards.'
      }
    ]
  },
  {
    title: 'Roulette Betting Systems: Do They Really Work?',
    tags: ['roulette', 'betting systems', 'strategy', 'casino'],
    seoDescription: 'Explore popular roulette betting systems like Martingale, Fibonacci, and D\'Alembert. Learn which strategies work and which are myths.',
    status: 'published',
    coverImage: 'https://images.unsplash.com/photo-1529419412599-7bb870e11810?q=80&w=987&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    sections: [
      {
        id: '1',
        type: 'heading',
        content: 'Understanding Roulette Systems'
      },
      {
        id: '2',
        type: 'text',
        content: 'Roulette betting systems have been around for centuries, promising players a way to beat the game. However, it\'s important to understand that no betting system can overcome the house edge in the long run. Each spin is independent, and the house always maintains its mathematical advantage.'
      },
      {
        id: '3',
        type: 'heading',
        content: 'Popular Betting Systems'
      },
      {
        id: '4',
        type: 'text',
        content: 'The Martingale system involves doubling your bet after each loss, while the Fibonacci system follows the famous number sequence. The D\'Alembert system uses a more conservative progression. While these can help manage your bankroll, they don\'t change the fundamental odds of the game.'
      }
    ]
  },
  {
    title: 'Live Dealer Games: The Future of Online Casinos',
    tags: ['live dealer', 'online casino', 'technology', 'gaming'],
    seoDescription: 'Discover how live dealer games are revolutionizing online casinos. Experience the thrill of real dealers from the comfort of your home.',
    status: 'published',
    coverImage: 'https://images.unsplash.com/photo-1529419412599-7bb870e11810?q=80&w=987&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    sections: [
      {
        id: '1',
        type: 'heading',
        content: 'What Are Live Dealer Games?'
      },
      {
        id: '2',
        type: 'text',
        content: 'Live dealer games combine the convenience of online gambling with the authentic experience of a land-based casino. Professional dealers operate real casino equipment while streaming the action live to your device. You can interact with dealers and other players in real-time, creating a social gaming experience.'
      },
      {
        id: '3',
        type: 'heading',
        content: 'Popular Live Dealer Games'
      },
      {
        id: '4',
        type: 'text',
        content: 'The most popular live dealer games include blackjack, roulette, baccarat, and poker variants. These games are streamed from professional studios or actual casino floors, providing high-quality video feeds and multiple camera angles for an immersive experience.'
      }
    ]
  }
];

// Categories to use (you can modify these based on your actual categories)
const categories = [
  'Casino Guides',
  'Slot Games',
  'Card Games',
  'Bonuses',
  'Strategy',
  'Technology',
  'Reviews',
  'News'
];

// Helper function to generate a random ID
function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

// Helper function to get a random category
function getRandomCategory(): string {
  return categories[Math.floor(Math.random() * categories.length)];
}

// API client
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Authentication function
async function authenticate(): Promise<string> {
  try {
    console.log('🔐 Authenticating...');
    const response = await api.post('/auth/login', {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
    });

    if (response.data.success && response.data.data?.token) {
      console.log('✅ Authentication successful');
      return response.data.data.token;
    } else {
      throw new Error('Authentication failed: Invalid response');
    }
  } catch (error: any) {
    if (error.response?.status === 401) {
      throw new Error('Authentication failed: Invalid email or password. Please check ADMIN_EMAIL and ADMIN_PASSWORD environment variables.');
    }
    throw new Error(`Authentication failed: ${error.message}`);
  }
}

// Create a single blog
async function createBlog(blogData: BlogData, token: string): Promise<void> {
  try {
    const response = await api.post(
      '/blogs',
      blogData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (response.data.success) {
      console.log(`✅ Created blog: "${blogData.title}"`);
    } else {
      console.error(`❌ Failed to create blog: "${blogData.title}" - ${response.data.error}`);
    }
  } catch (error: any) {
    console.error(`❌ Error creating blog "${blogData.title}":`, error.response?.data?.error || error.message);
  }
}

// Main seed function
async function seedBlogs() {
  console.log('🌱 Starting blog seed script...\n');

  try {
    // Authenticate
    const token = await authenticate();

    // Create blogs
    console.log(`\n📝 Creating ${blogTemplates.length} blogs...\n`);

    for (let i = 0; i < blogTemplates.length; i++) {
      const template = blogTemplates[i];
      const blogData: BlogData = {
        ...template,
        category: getRandomCategory(),
        sections: template.sections.map(section => ({
          ...section,
          id: generateId(),
        })),
      };

      await createBlog(blogData, token);

      // Small delay to avoid overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log(`\n✨ Seed script completed! Created ${blogTemplates.length} blogs.`);
  } catch (error: any) {
    console.error('\n❌ Seed script failed:', error.message);
    process.exit(1);
  }
}

// Run the seed script
seedBlogs();

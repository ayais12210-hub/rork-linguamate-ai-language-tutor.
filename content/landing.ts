export const landingContent = {
  hero: {
    headline: "Master languages with an AI that adapts to you",
    subheadline: "Personalised lessons, real-time feedback, and a curriculum that flows with your pace.",
    ctaPrimary: "Start Free",
    ctaSecondary: "See a 60-sec demo"
  },
  
  trustBar: {
    items: [
      { icon: "🌍", text: "20+ Languages" },
      { icon: "🎯", text: "Adaptive Onboarding" },
      { icon: "🎤", text: "Speech Scoring" },
      { icon: "📱", text: "Offline Mode" },
      { icon: "🧠", text: "AI-Powered" },
      { icon: "⚡", text: "Real-time Feedback" }
    ]
  },

  features: [
    {
      id: "adaptive-onboarding",
      icon: "Target",
      title: "Adaptive Onboarding",
      description: "Tell us your goals, learning style, and pace. We'll craft a personalised curriculum just for you.",
      gradient: "from-amber-400 to-orange-600"
    },
    {
      id: "ai-dialogues",
      icon: "MessageSquare",
      title: "AI Dialogues",
      description: "Practice real conversations with context-aware AI. Get instant feedback on grammar, vocabulary, and fluency.",
      gradient: "from-cyan-400 to-sky-600"
    },
    {
      id: "pronunciation-coach",
      icon: "Mic",
      title: "Pronunciation Coach",
      description: "Speak naturally and receive accent-tolerant scoring. Improve your pronunciation with targeted exercises.",
      gradient: "from-violet-400 to-purple-600"
    },
    {
      id: "grammar-mentor",
      icon: "BookOpen",
      title: "Grammar Mentor",
      description: "Master grammar rules with interactive lessons. Our AI explains concepts in your native language.",
      gradient: "from-emerald-400 to-green-600"
    },
    {
      id: "spaced-repetition",
      icon: "Calendar",
      title: "Spaced Repetition",
      description: "Never forget what you've learned. Our SRS algorithm schedules reviews at optimal intervals.",
      gradient: "from-pink-400 to-rose-600"
    },
    {
      id: "offline-packs",
      icon: "Download",
      title: "Offline Packs",
      description: "Download lessons and practice anywhere. Your progress syncs automatically when you're back online.",
      gradient: "from-indigo-400 to-blue-600"
    }
  ],

  curriculum: [
    { id: "alphabet", title: "Alphabet", icon: "🔤", description: "Master the basics" },
    { id: "numbers", title: "Numbers", icon: "🔢", description: "Count with confidence" },
    { id: "phrases", title: "Phrases", icon: "💬", description: "Essential expressions" },
    { id: "dialogues", title: "Dialogues", icon: "🗣️", description: "Real conversations" },
    { id: "culture", title: "Culture", icon: "🌏", description: "Cultural insights" },
    { id: "fluency", title: "Fluency", icon: "🎓", description: "Advanced mastery" }
  ],

  personalization: {
    title: "Your Learning, Your Way",
    subtitle: "Answer a few questions and we'll build a curriculum tailored to your goals.",
    questions: [
      { id: "style", label: "Learning Style", options: ["Visual", "Auditory", "Kinesthetic", "Reading/Writing"] },
      { id: "pace", label: "Pace", options: ["Relaxed", "Moderate", "Intensive"] },
      { id: "accessibility", label: "Accessibility", options: ["None", "Screen Reader", "High Contrast", "Large Text"] }
    ]
  },

  pricing: {
    title: "Choose Your Plan",
    subtitle: "Start free, upgrade anytime. No credit card required.",
    plans: [
      {
        id: "free",
        name: "Free",
        price: "£0",
        period: "forever",
        features: [
          "1 language",
          "Basic lessons",
          "Limited AI dialogues",
          "Community support"
        ],
        cta: "Start Free",
        highlighted: false
      },
      {
        id: "monthly",
        name: "Monthly",
        price: "£9.99",
        period: "per month",
        features: [
          "Unlimited languages",
          "Full curriculum access",
          "Unlimited AI dialogues",
          "Pronunciation coach",
          "Offline mode",
          "Priority support"
        ],
        cta: "Start Monthly",
        highlighted: false
      },
      {
        id: "annual",
        name: "Annual",
        price: "£79.99",
        period: "per year",
        badge: "Best Value",
        features: [
          "Everything in Monthly",
          "Save 33%",
          "Early access to new features",
          "Dedicated support",
          "Lifetime updates"
        ],
        cta: "Start Annual",
        highlighted: true
      },
      {
        id: "student",
        name: "Student",
        price: "£4.99",
        period: "per month",
        badge: "50% Off",
        features: [
          "Everything in Monthly",
          "Student verification required",
          "Study groups",
          "Academic resources"
        ],
        cta: "Verify Student",
        highlighted: false
      }
    ],
    faq: [
      {
        question: "Can I switch plans anytime?",
        answer: "Yes! Upgrade or downgrade your plan at any time. Changes take effect immediately."
      },
      {
        question: "Do you offer refunds?",
        answer: "We offer a 30-day money-back guarantee. If you're not satisfied, we'll refund you in full."
      },
      {
        question: "What payment methods do you accept?",
        answer: "We accept all major credit cards, PayPal, and Apple Pay."
      },
      {
        question: "Is there a free trial?",
        answer: "Yes! Start with our free plan and upgrade when you're ready. No credit card required."
      }
    ]
  },

  testimonials: [
    {
      id: "1",
      name: "Sarah Chen",
      avatar: "https://i.pravatar.cc/150?img=1",
      flag: "🇬🇧",
      rating: 5,
      text: "Linguamate helped me become conversational in Spanish in just 3 months. The AI dialogues feel so natural!"
    },
    {
      id: "2",
      name: "Raj Patel",
      avatar: "https://i.pravatar.cc/150?img=2",
      flag: "🇮🇳",
      rating: 5,
      text: "The pronunciation coach is incredible. I finally feel confident speaking French with native speakers."
    },
    {
      id: "3",
      name: "Emma Wilson",
      avatar: "https://i.pravatar.cc/150?img=3",
      flag: "🇺🇸",
      rating: 5,
      text: "Best language app I've tried. The adaptive curriculum keeps me challenged but never overwhelmed."
    },
    {
      id: "4",
      name: "Yuki Tanaka",
      avatar: "https://i.pravatar.cc/150?img=4",
      flag: "🇯🇵",
      rating: 5,
      text: "Offline mode is a game-changer. I can practice during my commute without worrying about data."
    }
  ],

  cta: {
    title: "Start in 60 seconds—no credit card",
    subtitle: "Join thousands of learners mastering new languages with AI.",
    ctaPrimary: "Start Free",
    ctaSecondary: "Download APK"
  },

  footer: {
    tagline: "Master languages with AI",
    sections: [
      {
        title: "Product",
        links: [
          { label: "Features", href: "#features" },
          { label: "Pricing", href: "#pricing" },
          { label: "Download", href: "#download" },
          { label: "Roadmap", href: "#roadmap" }
        ]
      },
      {
        title: "Resources",
        links: [
          { label: "Blog", href: "/blog" },
          { label: "Help Centre", href: "/help" },
          { label: "Community", href: "/community" },
          { label: "API Docs", href: "/docs" }
        ]
      },
      {
        title: "Company",
        links: [
          { label: "About", href: "/about" },
          { label: "Careers", href: "/careers" },
          { label: "Press", href: "/press" },
          { label: "Contact", href: "/contact" }
        ]
      },
      {
        title: "Legal",
        links: [
          { label: "Privacy", href: "/privacy-policy" },
          { label: "Terms", href: "/terms" },
          { label: "Security", href: "/security" },
          { label: "Cookies", href: "/cookies" }
        ]
      }
    ]
  },

  demo: {
    languages: [
      { code: "es", name: "Spanish", flag: "🇪🇸" },
      { code: "fr", name: "French", flag: "🇫🇷" },
      { code: "de", name: "German", flag: "🇩🇪" },
      { code: "it", name: "Italian", flag: "🇮🇹" },
      { code: "pt", name: "Portuguese", flag: "🇵🇹" },
      { code: "ja", name: "Japanese", flag: "🇯🇵" },
      { code: "ko", name: "Korean", flag: "🇰🇷" },
      { code: "zh", name: "Chinese", flag: "🇨🇳" },
      { code: "ar", name: "Arabic", flag: "🇸🇦" },
      { code: "hi", name: "Hindi", flag: "🇮🇳" },
      { code: "pa", name: "Punjabi", flag: "🇮🇳" }
    ],
    difficulties: ["Beginner", "Intermediate", "Advanced"],
    goals: ["Travel", "Business", "Academic", "Personal"],
    sampleDialogue: {
      prompt: "How do I order coffee in Spanish?",
      response: "Great question! Here's how you'd order coffee in Spanish:\n\n**Basic order:**\n'Un café, por favor' (A coffee, please)\n\n**With milk:**\n'Un café con leche, por favor' (A coffee with milk, please)\n\n**Pronunciation tip:** The 'c' in 'café' sounds like 'k', and the accent on the 'é' means you stress that syllable: kah-FEH.\n\nWould you like to practice this dialogue?"
    }
  },

  languages: [
    { code: "en", name: "English", flag: "🇬🇧", nativeName: "English" },
    { code: "es", name: "Spanish", flag: "🇪🇸", nativeName: "Español" },
    { code: "fr", name: "French", flag: "🇫🇷", nativeName: "Français" },
    { code: "de", name: "German", flag: "🇩🇪", nativeName: "Deutsch" },
    { code: "it", name: "Italian", flag: "🇮🇹", nativeName: "Italiano" },
    { code: "pt", name: "Portuguese", flag: "🇵🇹", nativeName: "Português" },
    { code: "ja", name: "Japanese", flag: "🇯🇵", nativeName: "日本語" },
    { code: "ko", name: "Korean", flag: "🇰🇷", nativeName: "한국어" },
    { code: "zh", name: "Chinese", flag: "🇨🇳", nativeName: "中文" },
    { code: "ar", name: "Arabic", flag: "🇸🇦", nativeName: "العربية" },
    { code: "hi", name: "Hindi", flag: "🇮🇳", nativeName: "हिन्दी" },
    { code: "pa", name: "Punjabi", flag: "🇮🇳", nativeName: "ਪੰਜਾਬੀ" }
  ]
} as const;

export type LandingContent = typeof landingContent;

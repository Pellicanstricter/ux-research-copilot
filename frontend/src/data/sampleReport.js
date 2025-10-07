export const sampleReport = {
  themes: [
    {
      theme_name: "Navigation & Usability Concerns",
      summary: "Users frequently struggled with finding key features and expressed confusion about the navigation structure. Multiple participants mentioned difficulty locating the settings page and search functionality.",
      insights: [
        { quote: "I couldn't figure out where to change my preferences. Took me like 5 minutes to find the settings." },
        { quote: "The menu structure doesn't make sense to me. I expected the search to be at the top, not hidden in a dropdown." },
        { quote: "Everything feels buried. I'm clicking around just trying to find basic things." },
        { quote: "The navigation is confusing. I don't know where to go to accomplish my tasks." }
      ]
    },
    {
      theme_name: "Performance & Speed Issues",
      summary: "Multiple users reported slow load times and lag when performing common actions. This friction point significantly impacted user satisfaction and task completion rates.",
      insights: [
        { quote: "It takes forever to load. I find myself waiting a lot, which is frustrating when I'm trying to get work done." },
        { quote: "The app is really slow, especially when I'm uploading files. Sometimes I think it crashed." },
        { quote: "I've noticed significant delays when switching between pages. It makes the whole experience feel sluggish." },
        { quote: "Speed is a major issue for me. In a fast-paced environment, I can't afford to wait for things to load." }
      ]
    },
    {
      theme_name: "Feature Discovery & Onboarding",
      summary: "New users struggled to understand available features and how to use them effectively. The lack of guided onboarding led to underutilization of key functionality.",
      insights: [
        { quote: "I had no idea this feature existed until my coworker showed me. There should be some kind of tour or introduction." },
        { quote: "I'm probably not using this app to its full potential because I don't know what's available." },
        { quote: "A tutorial or walkthrough would have been really helpful when I first started using this." },
        { quote: "I discovered features by accident. There's no clear way to learn what the app can do." }
      ]
    }
  ],
  key_insights: [
    {
      title: "Critical Navigation Issues Impact Task Completion",
      main_finding: "Users are abandoning tasks due to inability to find key features. The current navigation structure creates a significant barrier to successful product usage, with 7 out of 10 participants unable to locate settings within 2 minutes.",
      priority: "High",
      supporting_quotes: [
        { quote: "I couldn't figure out where to change my preferences. Took me like 5 minutes to find the settings." },
        { quote: "The menu structure doesn't make sense to me. I expected the search to be at the top." },
        { quote: "Everything feels buried. I'm clicking around just trying to find basic things." },
        { quote: "I gave up trying to find the export feature. It's just not worth the hassle." }
      ]
    },
    {
      title: "Performance Issues Erode User Trust",
      main_finding: "Slow load times and lag are causing users to question the reliability of the platform. This performance degradation is particularly acute during file uploads and page transitions, leading to user frustration and decreased engagement.",
      priority: "High",
      supporting_quotes: [
        { quote: "It takes forever to load. I find myself waiting a lot, which is frustrating." },
        { quote: "The app is really slow, especially when uploading files. Sometimes I think it crashed." },
        { quote: "Speed is a major issue. In a fast-paced environment, I can't afford to wait." },
        { quote: "I've started using competitor products because they're faster, even if they have fewer features." }
      ]
    },
    {
      title: "Missing Onboarding Reduces Feature Adoption",
      main_finding: "The absence of guided onboarding and feature discovery mechanisms results in users only utilizing 30-40% of available functionality. Power features remain undiscovered, limiting the perceived value of the product.",
      priority: "Medium",
      supporting_quotes: [
        { quote: "I had no idea this feature existed until my coworker showed me." },
        { quote: "I'm probably not using this app to its full potential because I don't know what's available." },
        { quote: "A tutorial would have been really helpful when I first started." },
        { quote: "I learn features by accident. There's no clear way to discover what the app can do." }
      ]
    }
  ],
  recommendations: [
    {
      title: "Redesign Navigation Architecture",
      description: "Implement a flat, intuitive navigation structure with commonly-used features accessible within 2 clicks. Add a persistent search bar and reorganize menu categories based on user mental models.",
      details: [
        "Conduct card sorting exercise to validate new IA",
        "Place search prominently in header",
        "Implement breadcrumb navigation",
        "Add quick access shortcuts for frequent tasks"
      ]
    },
    {
      title: "Optimize Performance & Loading Times",
      description: "Conduct technical audit to identify and resolve performance bottlenecks. Implement lazy loading, optimize database queries, and add progress indicators for long-running operations.",
      details: [
        "Profile and optimize slow API endpoints",
        "Implement progressive loading for large datasets",
        "Add loading skeletons and progress bars",
        "Optimize image and asset delivery"
      ]
    },
    {
      title: "Create Interactive Onboarding Experience",
      description: "Design and implement a contextual onboarding flow that introduces key features progressively. Include interactive tooltips, feature highlights, and a searchable help center.",
      details: [
        "Build 5-step initial product tour",
        "Add contextual tooltips for new features",
        "Create searchable knowledge base",
        "Implement 'What's New' notifications"
      ]
    },
    {
      title: "Implement User Feedback Loop",
      description: "Establish regular channels for user feedback collection and feature requests. Create a public roadmap to communicate upcoming improvements and build user confidence.",
      details: [
        "Add in-app feedback widget",
        "Conduct quarterly user interviews",
        "Publish transparent product roadmap",
        "Send monthly product updates newsletter"
      ]
    }
  ]
};

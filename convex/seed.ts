import { api } from "./_generated/api";
import { action } from "./_generated/server";

// Seed data for Mission Control
export const seed = action({
  args: {},
  handler: async (ctx) => {
    const now = new Date().toISOString();
    
    // ========== TEAM MEMBERS (AI Agents) ==========
    const teamMembers = [
      {
        name: "Gabriel",
        type: "ai" as const,
        role: "orchestrator",
        description: "Main AI assistant coordinating all operations. Handles task management, content strategy, and agent supervision.",
        skills: ["task management", "content strategy", "agent coordination", "system design"],
        status: "online" as const,
        avatar: "🕊️",
        createdAt: now,
        updatedAt: now,
      },
      {
        name: "Content Agent",
        type: "ai" as const,
        role: "writer",
        description: "Automated blog post generation. Researches topics, writes SEO-optimized content, humanizes with Walter Writes.",
        skills: ["blog writing", "SEO optimization", "content research", "Walter Writes humanization"],
        status: "online" as const,
        avatar: "✍️",
        createdAt: now,
        updatedAt: now,
      },
      {
        name: "Lead Gen Agent",
        type: "ai" as const,
        role: "sales",
        description: "Lead discovery, scoring, and outreach. Finds prospects, personalizes emails, manages follow-ups via SendGrid.",
        skills: ["lead research", "email personalization", "SendGrid integration", "CRM management"],
        status: "online" as const,
        avatar: "🎯",
        createdAt: now,
        updatedAt: now,
      },
      {
        name: "Design System Architect",
        type: "ai" as const,
        role: "designer",
        description: "Apple HIG-inspired design system creator. Built 30+ components, tokens, patterns for luxury jewelry brand.",
        skills: ["UI/UX design", "design systems", "Apple HIG", "Tailwind CSS", "shadcn/ui"],
        status: "online" as const,
        avatar: "🎨",
        createdAt: now,
        updatedAt: now,
      },
      {
        name: "Armen",
        type: "human" as const,
        role: "founder",
        description: "Founder of CADCAM Designs. Visionary leader building autonomous AI organization for 24/7 value production.",
        skills: ["CAD/CAM expertise", "jewelry design", "business strategy", "AI orchestration"],
        status: "online" as const,
        avatar: "👤",
        createdAt: now,
        updatedAt: now,
      },
    ];

    for (const member of teamMembers) {
      await ctx.runMutation(api.team.createTeamMember, member);
    }

    // ========== TASKS ==========
    const tasks = [
      {
        title: "Build Mission Control Dashboard",
        description: "Create NextJS + Convex real-time dashboard with 6 components (Tasks, Content, Calendar, Memory, Team, Office)",
        status: "done" as const,
        priority: "high" as const,
        assignee: "openclaw" as const,
        tags: ["dashboard", "infrastructure"],
        dueDate: now,
        createdAt: now,
        updatedAt: now,
      },
      {
        title: "Create Content Agent",
        description: "Automated blog generation: research → write → humanize → publish workflow",
        status: "done" as const,
        priority: "high" as const,
        assignee: "openclaw" as const,
        tags: ["agent", "content"],
        dueDate: now,
        createdAt: now,
        updatedAt: now,
      },
      {
        title: "Create Lead Gen Agent",
        description: "Lead discovery, scoring, and automated outreach with SendGrid integration",
        status: "done" as const,
        priority: "high" as const,
        assignee: "openclaw" as const,
        tags: ["agent", "sales", "leads"],
        dueDate: now,
        createdAt: now,
        updatedAt: now,
      },
      {
        title: "Build Design System",
        description: "Apple HIG-inspired design system: 30+ components, tokens, patterns for luxury jewelry brand",
        status: "done" as const,
        priority: "high" as const,
        assignee: "openclaw" as const,
        tags: ["design", "system"],
        dueDate: now,
        createdAt: now,
        updatedAt: now,
      },
      {
        title: "Deploy Mission Control to Vercel",
        description: "Make dashboard accessible remotely for 24/7 monitoring",
        status: "done" as const,
        priority: "high" as const,
        assignee: "human" as const,
        tags: ["deployment", "infrastructure"],
        dueDate: now,
        createdAt: now,
        updatedAt: now,
      },
      {
        title: "Fix TypeScript Build Errors",
        description: "Resolve type mismatches between Convex schema and frontend for successful Vercel deployment",
        status: "done" as const,
        priority: "high" as const,
        assignee: "human" as const,
        tags: ["typescript", "bugfix"],
        dueDate: now,
        createdAt: now,
        updatedAt: now,
      },
      {
        title: "Populate Mission Control with Data",
        description: "Seed dashboard with team members, tasks, content, and memories",
        status: "in-progress" as const,
        priority: "medium" as const,
        assignee: "openclaw" as const,
        tags: ["data", "setup"],
        dueDate: now,
        createdAt: now,
        updatedAt: now,
      },
    ];

    for (const task of tasks) {
      await ctx.runMutation(api.tasks.createTask, task);
    }

    // ========== CONTENT PIPELINE ==========
    const contentItems = [
      {
        title: "Jewelry CAD Trends 2025",
        description: "Blog post about emerging CAD/CAM trends in jewelry industry",
        stage: "published" as const,
        contentType: "blog" as const,
        platform: "CADCAM Designs Blog",
        scriptContent: "Comprehensive analysis of CAD/CAM trends including AI-powered design, sustainable manufacturing, and parametric modeling...",
        assignedTo: "openclaw" as const,
        tags: ["trends", "2025", "CAD/CAM"],
        createdAt: now,
        updatedAt: now,
      },
      {
        title: "Design System Documentation",
        description: "Complete Apple HIG-inspired design system for CADCAM Designs",
        stage: "published" as const,
        contentType: "blog" as const,
        platform: "Internal Documentation",
        scriptContent: "30+ components, design tokens, patterns, and implementation guidelines...",
        assignedTo: "openclaw" as const,
        tags: ["design-system", "documentation"],
        createdAt: now,
        updatedAt: now,
      },
      {
        title: "AI-Powered Jewelry Design Workflow",
        description: "YouTube video script about integrating AI into jewelry design process",
        stage: "script" as const,
        contentType: "video" as const,
        platform: "YouTube",
        scriptContent: "Draft script covering AI tools, workflow optimization, and case studies...",
        assignedTo: "openclaw" as const,
        tags: ["AI", "workflow", "tutorial"],
        createdAt: now,
        updatedAt: now,
      },
    ];

    for (const content of contentItems) {
      await ctx.runMutation(api.content.createContent, content);
    }

    // ========== MEMORIES ==========
    const memories = [
      {
        title: "Mission Control Deployed Successfully",
        content: "After resolving TypeScript type mismatches between Convex schema and frontend code, Mission Control is now live at https://mission-control-orpin-six.vercel.app/. The fix involved using explicit union types instead of derived types from Doc<> to avoid Turbopack build issues.",
        type: "decision" as const,
        tags: ["deployment", "typescript", "vercel", "mission-control"],
        source: "GitHub + Vercel",
        importance: "high" as const,
        createdAt: now,
        updatedAt: now,
      },
      {
        title: "AI Organization Architecture Decided",
        content: "Built autonomous AI organization structure: Mission Control (central dashboard) + Content Agent + Lead Gen Agent + Design System Architect. Goal: 24/7 value production for CADCAM Designs.",
        type: "decision" as const,
        tags: ["architecture", "AI-org", "strategy"],
        source: "Strategic Planning",
        importance: "high" as const,
        createdAt: now,
        updatedAt: now,
      },
      {
        title: "SendGrid Integration Live",
        content: "Lead Gen Agent successfully connected to SendGrid. Can send 100 emails/day on free tier. Test email sent to armencad@gmail.com successfully.",
        type: "insight" as const,
        tags: ["sendgrid", "email", "lead-gen"],
        source: "Agent Testing",
        importance: "medium" as const,
        createdAt: now,
        updatedAt: now,
      },
      {
        title: "15 Leads Discovered",
        content: "Lead Gen Agent found 15 qualified leads for jewelry CAD/CAM services. 8 warm leads (score 40-69) ready for outreach. Email templates generated for 6 warm leads.",
        type: "insight" as const,
        tags: ["leads", "sales", "prospecting"],
        source: "Lead Gen Agent",
        importance: "high" as const,
        createdAt: now,
        updatedAt: now,
      },
      {
        title: "7 Blog Drafts Ready for Humanization",
        content: "Content Agent generated 7 blog post drafts (500-600 words each) covering jewelry CAD topics. All drafts ready for WalterWrites.ai humanization before publishing.",
        type: "insight" as const,
        tags: ["content", "blog", "AI-writing"],
        source: "Content Agent",
        importance: "medium" as const,
        createdAt: now,
        updatedAt: now,
      },
      {
        title: "Convex Type Resolution Issue",
        content: "Discovered that Convex Doc<> types don't resolve correctly with Next.js Turbopack during Vercel builds. Solution: use explicit union types and ignoreBuildErrors in next.config.ts.",
        type: "insight" as const,
        tags: ["typescript", "convex", "turbopack", "build"],
        source: "Debugging",
        importance: "medium" as const,
        createdAt: now,
        updatedAt: now,
      },
    ];

    for (const memory of memories) {
      await ctx.runMutation(api.memories.createMemory, memory);
    }

    // ========== CALENDAR EVENTS ==========
    const calendarEvents = [
      {
        title: "Mission Control Launch",
        description: "Dashboard deployed to Vercel and live",
        type: "milestone" as const,
        startDate: now,
        allDay: true,
        color: "#22c55e",
        assignedTo: "openclaw" as const,
        createdAt: now,
        updatedAt: now,
      },
      {
        title: "Daily Content Check",
        description: "Automated check for new content ideas and blog opportunities",
        type: "cron" as const,
        startDate: now,
        recurrence: "daily",
        color: "#3b82f6",
        assignedTo: "openclaw" as const,
        createdAt: now,
        updatedAt: now,
      },
      {
        title: "Weekly Lead Follow-up",
        description: "Review lead scores and send follow-up emails to warm prospects",
        type: "cron" as const,
        startDate: now,
        recurrence: "weekly",
        color: "#8b5cf6",
        assignedTo: "openclaw" as const,
        createdAt: now,
        updatedAt: now,
      },
    ];

    for (const event of calendarEvents) {
      await ctx.runMutation(api.calendar.createEvent, event);
    }

    return { 
      success: true, 
      message: "Mission Control populated successfully!",
      stats: {
        teamMembers: teamMembers.length,
        tasks: tasks.length,
        contentItems: contentItems.length,
        memories: memories.length,
        calendarEvents: calendarEvents.length,
      }
    };
  },
});
import { v } from "convex/values";
import { mutation } from "./_generated/server";

// Public mutation to seed initial data - can be called from frontend
export const populateData = mutation({
  args: {},
  handler: async (ctx) => {
    const now = new Date().toISOString();
    
    // Check if data already exists
    const existingTeam = await ctx.db.query("team").first();
    if (existingTeam) {
      return { success: false, message: "Data already exists!" };
    }

    // ========== TEAM MEMBERS ==========
    await ctx.db.insert("team", {
      name: "Gabriel",
      role: "orchestrator",
      type: "agent",
      avatar: "🕊️",
      status: "online",
      skills: ["task management", "content strategy", "agent coordination", "system design"],
      description: "Main AI assistant coordinating all operations.",
      currentTask: undefined,
      createdAt: now,
      lastActive: now,
    });

    await ctx.db.insert("team", {
      name: "Content Agent",
      role: "writer",
      type: "agent",
      avatar: "✍️",
      status: "online",
      skills: ["blog writing", "SEO optimization", "content research"],
      description: "Automated blog post generation agent.",
      currentTask: undefined,
      createdAt: now,
      lastActive: now,
    });

    await ctx.db.insert("team", {
      name: "Lead Gen Agent",
      role: "sales",
      type: "agent",
      avatar: "🎯",
      status: "online",
      skills: ["lead research", "email personalization", "CRM management"],
      description: "Lead discovery and outreach agent.",
      currentTask: undefined,
      createdAt: now,
      lastActive: now,
    });

    await ctx.db.insert("team", {
      name: "Design System Architect",
      role: "designer",
      type: "agent",
      avatar: "🎨",
      status: "online",
      skills: ["UI/UX design", "design systems", "Apple HIG"],
      description: "Design system creator for luxury brand.",
      currentTask: undefined,
      createdAt: now,
      lastActive: now,
    });

    await ctx.db.insert("team", {
      name: "Armen",
      role: "founder",
      type: "human",
      avatar: "👤",
      status: "online",
      skills: ["CAD/CAM expertise", "jewelry design", "business strategy"],
      description: "Founder of CADCAM Designs.",
      currentTask: undefined,
      createdAt: now,
      lastActive: now,
    });

    // ========== TASKS ==========
    await ctx.db.insert("tasks", {
      title: "Build Mission Control Dashboard",
      description: "Create NextJS + Convex real-time dashboard with 6 components",
      status: "done",
      priority: "high",
      assignee: "openclaw",
      tags: ["dashboard", "infrastructure"],
      dueDate: now,
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.insert("tasks", {
      title: "Create Content Agent",
      description: "Automated blog generation workflow",
      status: "done",
      priority: "high",
      assignee: "openclaw",
      tags: ["agent", "content"],
      dueDate: now,
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.insert("tasks", {
      title: "Create Lead Gen Agent",
      description: "Lead discovery, scoring, and automated outreach",
      status: "done",
      priority: "high",
      assignee: "openclaw",
      tags: ["agent", "sales", "leads"],
      dueDate: now,
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.insert("tasks", {
      title: "Build Design System",
      description: "Apple HIG-inspired design system with 30+ components",
      status: "done",
      priority: "high",
      assignee: "openclaw",
      tags: ["design", "system"],
      dueDate: now,
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.insert("tasks", {
      title: "Deploy Mission Control to Vercel",
      description: "Make dashboard accessible remotely",
      status: "done",
      priority: "high",
      assignee: "human",
      tags: ["deployment", "infrastructure"],
      dueDate: now,
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.insert("tasks", {
      title: "Fix TypeScript Build Errors",
      description: "Resolve type mismatches for successful deployment",
      status: "done",
      priority: "high",
      assignee: "human",
      tags: ["typescript", "bugfix"],
      dueDate: now,
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.insert("tasks", {
      title: "Populate Mission Control with Data",
      description: "Seed dashboard with team, tasks, content, and memories",
      status: "in-progress",
      priority: "medium",
      assignee: "openclaw",
      tags: ["data", "setup"],
      dueDate: now,
      createdAt: now,
      updatedAt: now,
    });

    // ========== CONTENT ==========
    await ctx.db.insert("content", {
      title: "Jewelry CAD Trends 2025",
      description: "Blog post about emerging CAD/CAM trends in jewelry industry",
      stage: "published",
      contentType: "blog",
      platform: "CADCAM Designs Blog",
      scriptContent: "Comprehensive analysis of CAD/CAM trends...",
      assignedTo: "openclaw",
      tags: ["trends", "2025", "CAD/CAM"],
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.insert("content", {
      title: "Design System Documentation",
      description: "Complete Apple HIG-inspired design system",
      stage: "published",
      contentType: "blog",
      platform: "Internal Documentation",
      scriptContent: "30+ components, design tokens, patterns...",
      assignedTo: "openclaw",
      tags: ["design-system", "documentation"],
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.insert("content", {
      title: "AI-Powered Jewelry Design Workflow",
      description: "YouTube video script about AI in jewelry design",
      stage: "script",
      contentType: "video",
      platform: "YouTube",
      scriptContent: "Draft script covering AI tools and workflow optimization...",
      assignedTo: "openclaw",
      tags: ["AI", "workflow", "tutorial"],
      createdAt: now,
      updatedAt: now,
    });

    // ========== MEMORIES ==========
    await ctx.db.insert("memories", {
      title: "Mission Control Deployed Successfully",
      content: "After resolving TypeScript issues, Mission Control is now live at https://mission-control-orpin-six.vercel.app/",
      type: "decision",
      tags: ["deployment", "typescript", "vercel"],
      source: "GitHub + Vercel",
      importance: "high",
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.insert("memories", {
      title: "AI Organization Architecture Decided",
      content: "Built autonomous AI organization: Mission Control + Content Agent + Lead Gen Agent + Design System Architect",
      type: "decision",
      tags: ["architecture", "AI-org", "strategy"],
      source: "Strategic Planning",
      importance: "high",
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.insert("memories", {
      title: "SendGrid Integration Live",
      content: "Lead Gen Agent connected to SendGrid. Test email sent successfully.",
      type: "insight",
      tags: ["sendgrid", "email", "lead-gen"],
      source: "Agent Testing",
      importance: "medium",
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.insert("memories", {
      title: "15 Leads Discovered",
      content: "Lead Gen Agent found 15 qualified leads. 8 warm leads ready for outreach.",
      type: "insight",
      tags: ["leads", "sales", "prospecting"],
      source: "Lead Gen Agent",
      importance: "high",
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.insert("memories", {
      title: "7 Blog Drafts Ready",
      content: "Content Agent generated 7 blog drafts ready for humanization.",
      type: "insight",
      tags: ["content", "blog", "AI-writing"],
      source: "Content Agent",
      importance: "medium",
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.insert("memories", {
      title: "Convex Type Resolution Issue",
      content: "Discovered Convex Doc types don't resolve with Turbopack. Solution: explicit union types.",
      type: "insight",
      tags: ["typescript", "convex", "turbopack"],
      source: "Debugging",
      importance: "medium",
      createdAt: now,
      updatedAt: now,
    });

    // ========== CALENDAR EVENTS ==========
    await ctx.db.insert("calendar", {
      title: "Mission Control Launch",
      description: "Dashboard deployed to Vercel and live",
      type: "milestone",
      startDate: now,
      allDay: true,
      color: "#22c55e",
      assignedTo: "openclaw",
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.insert("calendar", {
      title: "Daily Content Check",
      description: "Automated check for new content ideas",
      type: "cron",
      startDate: now,
      recurrence: "daily",
      color: "#3b82f6",
      assignedTo: "openclaw",
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.insert("calendar", {
      title: "Weekly Lead Follow-up",
      description: "Review lead scores and send follow-ups",
      type: "cron",
      startDate: now,
      recurrence: "weekly",
      color: "#8b5cf6",
      assignedTo: "openclaw",
      createdAt: now,
      updatedAt: now,
    });

    return { 
      success: true, 
      message: "Mission Control populated successfully!",
      stats: {
        teamMembers: 5,
        tasks: 7,
        contentItems: 3,
        memories: 6,
        calendarEvents: 3,
      }
    };
  },
});
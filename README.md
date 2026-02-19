# OpenClaw Mission Control

A real-time dashboard for managing your OpenClaw setup, inspired by Alex Finn's viral X post.

## Features

### 1. Tasks Board (Kanban)
- Drag-and-drop task management
- Assign tasks to Human or OpenClaw
- Priority levels and due dates
- Real-time status updates

### 2. Content Pipeline
- Kanban workflow: Ideas → Script → Thumbnail → Filming → Editing → Published
- Attach scripts and thumbnail images
- Assign content creation tasks
- Track publishing schedule

### 3. Calendar
- View scheduled tasks and cron jobs
- Visual confirmation of OpenClaw's scheduled work
- Meeting and milestone tracking

### 4. Memory
- Searchable archive of all conversations and memories
- Tag-based organization
- Global search through your entire digital history

### 5. Team
- Digital organization structure
- Shows main agent + subagents
- Role-based categorization (developers, writers, designers)
- Agent status tracking

### 6. Office
- Visual workspace with agent avatars
- See who's online and working
- Real-time activity indicators
- " desks" for each team member

## Tech Stack

- **Next.js 14** - React framework with App Router
- **Convex** - Real-time database
- **TypeScript** - Type-safe code
- **Tailwind CSS** - Utility-first styling
- **shadcn/ui** - UI components
- **@dnd-kit** - Drag and drop for Kanban boards
- **Framer Motion** - Animations

## Getting Started

### 1. Install Dependencies

```bash
cd ~/.openclaw/workspace/mission-control
npm install
```

### 2. Set Up Convex

```bash
npx convex dev
```

This will:
- Create a Convex project
- Start the Convex dev server
- Generate the Convex client

### 3. Run the App

```bash
npm run dev
```

Open http://localhost:3000 to see your Mission Control dashboard.

## OpenClaw Integration

Your OpenClaw can push data to Mission Control using the Convex API:

### Example: Creating a Task

```typescript
import { api } from "@/convex/_generated/api";

// From your OpenClaw automation
await fetch('https://your-convex-deployment.convex.site/api/tasks/create', {
  method: 'POST',
  body: JSON.stringify({
    title: "New Blog Post",
    description: "Write about CAD design trends",
    status: "todo",
    priority: "high",
    assignee: "openclaw",
    tags: ["blog", "content"],
  }),
});
```

### Auto-Integration Script

I've created a helper script at `~/.openclaw/workspace/mission-control/scripts/openclaw-bridge.ts` that your OpenClaw can use to automatically sync:

- Tasks from `sessions_spawn` calls
- Content pipeline status
- Scheduled cron jobs
- Team member activity
- Memory entries

## Project Structure

```
mission-control/
├── app/
│   ├── page.tsx              # Dashboard home
│   ├── tasks/page.tsx        # Tasks Board
│   ├── content/page.tsx      # Content Pipeline
│   ├── calendar/page.tsx     # Calendar
│   ├── memory/page.tsx       # Memory Archive
│   ├── team/page.tsx         # Team Structure
│   └── office/page.tsx       # Office View
├── components/
│   ├── ui/                   # shadcn components
│   ├── navigation-sidebar.tsx
│   └── providers/
│       └── convex-provider.tsx
├── convex/
│   ├── schema.ts             # Database schema
│   ├── tasks.ts              # Task functions
│   ├── content.ts            # Content functions
│   ├── calendar.ts           # Calendar functions
│   ├── memories.ts           # Memory functions
│   ├── team.ts               # Team functions
│   ├── office.ts             # Office functions
│   └── activity.ts           # Activity log
├── lib/
│   └── utils.ts              # Utilities
└── README.md
```

## Deployment

### Vercel (Recommended)

```bash
npm install -g vercel
vercel
```

Make sure to add your `CONVEX_DEPLOYMENT` and `CONVEX_URL` environment variables in the Vercel dashboard.

### Self-Hosted

```bash
npm run build
npm start
```

## Customization

The dashboard is designed to be customized for your specific workflows:

1. **Modify the schema** in `convex/schema.ts` to add custom fields
2. **Update the pages** in `app/` to match your workflow
3. **Add new components** to extend functionality
4. **Customize styling** with Tailwind classes

## Inspired By

This project was inspired by [Alex Finn's X post](https://x.com/AlexFinn/status/2024169334344679783) about OpenClaw Mission Control.

## Credits

- Built for OpenClaw
- Design pattern: Alex Finn
- Tech stack: Next.js + Convex + shadcn/ui

## License

MIT - Feel free to customize and extend!

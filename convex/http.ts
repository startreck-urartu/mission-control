import { httpRouter } from "convex/server";
import { v } from "convex/values";
import { internal, api } from "./_generated/api";
import { httpAction } from "./_generated/server";

const http = httpRouter();

// OpenClaw Integration API Endpoints

// POST /api/tasks - Create or update task from OpenClaw
http.route({
  path: "/api/tasks",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const body = await request.json();
    const taskId = await ctx.runMutation(internal.tasks.upsertTaskFromOpenClaw, body);
    return new Response(JSON.stringify({ success: true, taskId }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }),
});

// POST /api/content - Create or update content from OpenClaw
http.route({
  path: "/api/content",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const body = await request.json();
    const contentId = await ctx.runMutation(internal.content.upsertContentFromOpenClaw, body);
    return new Response(JSON.stringify({ success: true, contentId }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }),
});

// POST /api/memories - Add memory from OpenClaw
http.route({
  path: "/api/memories",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const body = await request.json();
    const memoryId = await ctx.runMutation(internal.memories.addConversationFromOpenClaw, body);
    return new Response(JSON.stringify({ success: true, memoryId }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }),
});

// POST /api/team/register - Register/update agent from OpenClaw
http.route({
  path: "/api/team/register",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const body = await request.json();
    const teamId = await ctx.runMutation(internal.team.registerAgentFromOpenClaw, body);
    return new Response(JSON.stringify({ success: true, teamId }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }),
});

// POST /api/team/heartbeat - Agent heartbeat from OpenClaw
http.route({
  path: "/api/team/heartbeat",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const body = await request.json();
    await ctx.runMutation(internal.team.updateAgentHeartbeat, body);
    await ctx.runMutation(internal.office.updateDeskHeartbeat, body);
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }),
});

// POST /api/office/position - Register/update desk position from OpenClaw
http.route({
  path: "/api/office/position",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const body = await request.json();
    const officeId = await ctx.runMutation(internal.office.registerDeskPosition, body);
    return new Response(JSON.stringify({ success: true, officeId }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }),
});

// POST /api/calendar/cron - Add/update cron job from OpenClaw
http.route({
  path: "/api/calendar/cron",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const body = await request.json();
    const eventId = await ctx.runMutation(internal.calendar.upsertCronJob, body);
    return new Response(JSON.stringify({ success: true, eventId }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }),
});

// POST /api/tasks/dispatch - Event-driven task dispatch (v3)
// Creates task + triggers n8n webhook for the target agent
http.route({
  path: "/api/tasks/dispatch",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      const body = await request.json();
      const {
        title, description, agent, priority, tags,
        callbackChannel, callbackChatId, replyToMessageId,
        chainNext, chainDepth, parentId,
      } = body;

      if (!title || !agent) {
        return new Response(
          JSON.stringify({ error: "title and agent are required" }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }

      // 1. Create dispatched task
      const taskId = await ctx.runMutation(internal.tasks.createDispatchedTask, {
        title,
        description,
        agent,
        priority: priority || "medium",
        tags: tags || [],
        callbackChannel,
        callbackChatId,
        replyToMessageId,
        chainNext,
        chainDepth: chainDepth ?? 0,
        parentId,
      });

      // 2. Get webhook URL for the target agent
      const webhooks = await ctx.runQuery(
        internal.settings.getInternal,
        { key: "agentWebhooks" }
      );
      const webhookUrl = webhooks?.[agent];

      let dispatched = false;
      if (webhookUrl) {
        try {
          // 3. Fire n8n webhook (triggers instant processing)
          const resp = await fetch(webhookUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              taskId: taskId as string,
              title,
              description,
              agent,
              priority: priority || "medium",
              tags: tags || [],
            }),
          });
          dispatched = resp.ok;
        } catch (e) {
          // Webhook failed — task still exists in Convex for stale sweeper
          console.error("Webhook dispatch failed:", e);
        }
      }

      return new Response(
        JSON.stringify({ taskId, status: "dispatched", webhookFired: dispatched }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    } catch (e: any) {
      return new Response(
        JSON.stringify({ error: e.message || "Dispatch failed" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  }),
});

// POST /api/tasks/complete - Agent reports task completion (v3)
// Called by n8n when agent finishes — updates task, handles chaining, triggers notification
http.route({
  path: "/api/tasks/complete",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      const body = await request.json();
      const { taskId, status, result, error } = body;

      if (!taskId || !status) {
        return new Response(
          JSON.stringify({ error: "taskId and status are required" }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }

      // 1. Complete the task (returns task metadata for chaining/notification)
      const task = await ctx.runMutation(internal.tasks.completeTask, {
        id: taskId,
        status,
        result,
        error,
      });

      // 2. Handle task chaining
      let chainedTaskId = null;
      if (task.chainNext && status === "agent-reviewed" && (task.chainDepth || 0) < 5) {
        const chainDescription = task.chainNext.promptTemplate.replace(
          "{{result}}", result || ""
        );
        chainedTaskId = await ctx.runMutation(internal.tasks.createDispatchedTask, {
          title: `Chained: ${task.chainNext.agent} follow-up for "${task.title}"`,
          description: chainDescription,
          agent: task.chainNext.agent,
          priority: task.priority || "medium",
          tags: task.tags || [],
          callbackChannel: task.callbackChannel,
          callbackChatId: task.callbackChatId,
          replyToMessageId: task.replyToMessageId,
          chainDepth: (task.chainDepth || 0) + 1,
          parentId: task._id,
        });

        // Trigger the chained agent's webhook
        const webhooks = await ctx.runQuery(
          internal.settings.getInternal,
          { key: "agentWebhooks" }
        );
        const nextUrl = webhooks?.[task.chainNext.agent];
        if (nextUrl) {
          try {
            await fetch(nextUrl, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                taskId: chainedTaskId as string,
                title: `Chained: ${task.chainNext.agent} follow-up`,
                description: chainDescription,
                agent: task.chainNext.agent,
                priority: task.priority || "medium",
                tags: task.tags || [],
              }),
            });
          } catch (e) {
            console.error("Chain webhook dispatch failed:", e);
          }
        }
      }

      // 3. Send result notification (only if no active chain)
      if (!chainedTaskId && task.callbackChannel && task.callbackChatId) {
        const notifyUrl = await ctx.runQuery(
          internal.settings.getInternal,
          { key: "resultNotifyWebhook" }
        );
        if (notifyUrl) {
          try {
            await fetch(notifyUrl as string, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                taskId: task._id,
                agent: task.claimedBy,
                status,
                result,
                error,
                callbackChannel: task.callbackChannel,
                callbackChatId: task.callbackChatId,
                replyToMessageId: task.replyToMessageId,
                title: task.title,
                priority: task.priority,
              }),
            });
          } catch (e) {
            console.error("Result notification failed:", e);
          }
        }
      }

      return new Response(
        JSON.stringify({ success: true, chainedTaskId }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    } catch (e: any) {
      return new Response(
        JSON.stringify({ error: e.message || "Complete failed" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  }),
});

// GET /api/health - Health check
http.route({
  path: "/api/health",
  method: "GET",
  handler: httpAction(async () => {
    return new Response(JSON.stringify({ status: "ok", service: "OpenClaw Mission Control" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }),
});

// GET /api/seed - Populate dashboard with initial data (one-time setup)
http.route({
  path: "/api/seed",
  method: "GET",
  handler: httpAction(async (ctx) => {
    const result = await ctx.runAction(api.seed.seed, {});
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }),
});

// POST /polymarket/sync - Sync trader state + trades from local daemon
http.route({
  path: "/polymarket/sync",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const body = await request.json();
    const { state, trades } = body;

    if (state) {
      await ctx.runMutation(internal.polymarketTrader.upsertTraderState, state);
    }
    if (trades && trades.length > 0) {
      await ctx.runMutation(internal.polymarketTrader.upsertTrades, { trades });
    }

    return new Response(
      JSON.stringify({ success: true, synced: { state: !!state, trades: trades?.length ?? 0 } }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }),
});

export default http;

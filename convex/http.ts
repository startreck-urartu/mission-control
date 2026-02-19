import { httpRouter } from "convex/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

const http = httpRouter();

// OpenClaw Integration API Endpoints

// POST /api/tasks - Create or update task from OpenClaw
http.route({
  path: "/api/tasks",
  method: "POST",
  handler: async (ctx, request) => {
    const body = await request.json();
    const taskId = await ctx.runMutation(internal.tasks.upsertTaskFromOpenClaw, body);
    return new Response(JSON.stringify({ success: true, taskId }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  },
});

// POST /api/content - Create or update content from OpenClaw
http.route({
  path: "/api/content",
  method: "POST",
  handler: async (ctx, request) => {
    const body = await request.json();
    const contentId = await ctx.runMutation(internal.content.upsertContentFromOpenClaw, body);
    return new Response(JSON.stringify({ success: true, contentId }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  },
});

// POST /api/memories - Add memory from OpenClaw
http.route({
  path: "/api/memories",
  method: "POST",
  handler: async (ctx, request) => {
    const body = await request.json();
    const memoryId = await ctx.runMutation(internal.memories.addConversationFromOpenClaw, body);
    return new Response(JSON.stringify({ success: true, memoryId }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  },
});

// POST /api/team/register - Register/update agent from OpenClaw
http.route({
  path: "/api/team/register",
  method: "POST",
  handler: async (ctx, request) => {
    const body = await request.json();
    const teamId = await ctx.runMutation(internal.team.registerAgentFromOpenClaw, body);
    return new Response(JSON.stringify({ success: true, teamId }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  },
});

// POST /api/team/heartbeat - Agent heartbeat from OpenClaw
http.route({
  path: "/api/team/heartbeat",
  method: "POST",
  handler: async (ctx, request) => {
    const body = await request.json();
    await ctx.runMutation(internal.team.updateAgentHeartbeat, body);
    await ctx.runMutation(internal.office.updateDeskHeartbeat, body);
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  },
});

// POST /api/office/position - Register/update desk position from OpenClaw
http.route({
  path: "/api/office/position",
  method: "POST",
  handler: async (ctx, request) => {
    const body = await request.json();
    const officeId = await ctx.runMutation(internal.office.registerDeskPosition, body);
    return new Response(JSON.stringify({ success: true, officeId }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  },
});

// POST /api/calendar/cron - Add/update cron job from OpenClaw
http.route({
  path: "/api/calendar/cron",
  method: "POST",
  handler: async (ctx, request) => {
    const body = await request.json();
    const eventId = await ctx.runMutation(internal.calendar.upsertCronJob, body);
    return new Response(JSON.stringify({ success: true, eventId }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  },
});

// GET /api/health - Health check
http.route({
  path: "/api/health",
  method: "GET",
  handler: async () => {
    return new Response(JSON.stringify({ status: "ok", service: "OpenClaw Mission Control" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  },
});

export default http;

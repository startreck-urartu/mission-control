import { GenericQueryCtx } from "convex/server";
import { TableNames } from "./_generated/dataModel";

export async function getAll<TableName extends TableNames>(
  ctx: GenericQueryCtx,
  table: TableName
): Promise<any[]> {
  return await ctx.db.query(table).collect();
}

export async function getFirstOrNull<TableName extends TableNames>(
  ctx: GenericQueryCtx,
  table: TableName,
  index: string,
  field: string,
  value: any
): Promise<any | null> {
  return await ctx.db
    .query(table)
    .withIndex(index, (q) => q.eq(field, value))
    .first();
}

import { GenericQueryCtx } from "convex/server";
import { DataModel, TableNames } from "./_generated/dataModel";

export async function getAll<TableName extends TableNames>(
  ctx: GenericQueryCtx<DataModel>,
  table: TableName
) {
  return await ctx.db.query(table).collect();
}

export async function getFirstOrNull<TableName extends TableNames>(
  ctx: GenericQueryCtx<DataModel>,
  table: TableName,
  index: string,
  field: string,
  value: string
) {
  return await ctx.db
    .query(table)
    .withIndex(index, (q: any) => q.eq(field, value))
    .first();
}

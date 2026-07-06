import { GenericQueryCtx } from "convex/server";
import { DataModel, TableNames } from "./_generated/dataModel";

export async function getAll<TableName extends TableNames>(
  ctx: GenericQueryCtx<DataModel>,
  table: TableName
) {
  return await ctx.db.query(table).collect();
}

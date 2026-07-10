"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Doc, Id } from "@/convex/_generated/dataModel";
import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { formatCurrency } from "@/lib/utils";
import {
  DollarSign,
  TrendingUp,
  Activity,
  Cpu,
  Plus,
  Trash2,
  Edit2,
  AlertCircle,
} from "lucide-react";

export default function UsageCostsPage() {
  const llmModels = useQuery(api.llmUsage.getAllLLMUsage);
  const totalStats = useQuery(api.llmUsage.getTotalSpending);
  const createModel = useMutation(api.llmUsage.createLLMModel);
  const updateModel = useMutation(api.llmUsage.updateLLMModel);
  const deleteModel = useMutation(api.llmUsage.deleteLLMModel);
  const { confirm, confirmDialog } = useConfirm();

  const statsLoading = totalStats === undefined;
  const modelsLoading = llmModels === undefined;

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingModel, setEditingModel] = useState<Doc<"llmUsage"> | null>(null);
  const [formData, setFormData] = useState({
    model: "",
    provider: "anthropic",
    costPerInputToken: 0,
    costPerOutputToken: 0,
    budgetLimit: 0,
    description: "",
  });

  const handleCreate = () => {
    setEditingModel(null);
    setFormData({
      model: "",
      provider: "anthropic",
      costPerInputToken: 0,
      costPerOutputToken: 0,
      budgetLimit: 0,
      description: "",
    });
    setIsDialogOpen(true);
  };

  const handleEdit = (model: Doc<"llmUsage">) => {
    setEditingModel(model);
    setFormData({
      model: model.model,
      provider: model.provider,
      costPerInputToken: model.costPerInputToken,
      costPerOutputToken: model.costPerOutputToken,
      budgetLimit: model.budgetLimit || 0,
      description: model.description || "",
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (editingModel) {
      await updateModel({
        id: editingModel._id,
        costPerInputToken: formData.costPerInputToken,
        costPerOutputToken: formData.costPerOutputToken,
        budgetLimit: formData.budgetLimit || undefined,
        description: formData.description || undefined,
      });
    } else {
      await createModel({
        model: formData.model,
        provider: formData.provider,
        costPerInputToken: formData.costPerInputToken,
        costPerOutputToken: formData.costPerOutputToken,
        budgetLimit: formData.budgetLimit || undefined,
        description: formData.description || undefined,
      });
    }
    setIsDialogOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (!(await confirm({ title: "Delete this model?", destructive: true }))) return;
    await deleteModel({ id: id as Id<"llmUsage"> });
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("en-US").format(num);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500";
      case "paused":
        return "bg-yellow-500";
      case "deprecated":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Usage & Costs</h1>
          <p className="text-gray-400 mt-1">Track LLM spending and token usage</p>
        </div>
        <Button onClick={handleCreate} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Add Model
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="glass card-hover highlight-top">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-200">Total Spend</CardTitle>
            <div className="p-2 rounded-lg bg-green-400/10">
              <DollarSign className="w-4 h-4 text-green-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {statsLoading ? <Skeleton className="h-8 w-20" /> : formatCurrency(totalStats.totalCost)}
            </div>
            <p className="text-xs text-gray-400 mt-1">Across all models</p>
          </CardContent>
        </Card>

        <Card className="glass card-hover highlight-top">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-200">Input Tokens</CardTitle>
            <div className="p-2 rounded-lg bg-blue-400/10">
              <TrendingUp className="w-4 h-4 text-blue-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {statsLoading ? <Skeleton className="h-8 w-20" /> : formatNumber(totalStats.totalInputTokens)}
            </div>
            <p className="text-xs text-gray-400 mt-1">Total consumed</p>
          </CardContent>
        </Card>

        <Card className="glass card-hover highlight-top">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-200">Output Tokens</CardTitle>
            <div className="p-2 rounded-lg bg-purple-400/10">
              <Activity className="w-4 h-4 text-purple-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {statsLoading ? <Skeleton className="h-8 w-20" /> : formatNumber(totalStats.totalOutputTokens)}
            </div>
            <p className="text-xs text-gray-400 mt-1">Total generated</p>
          </CardContent>
        </Card>

        <Card className="glass card-hover highlight-top">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-200">Active Models</CardTitle>
            <div className="p-2 rounded-lg bg-yellow-400/10">
              <Cpu className="w-4 h-4 text-yellow-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {statsLoading ? <Skeleton className="h-8 w-12" /> : totalStats.modelCount}
            </div>
            {statsLoading ? (
              <Skeleton className="h-4 w-24 mt-1" />
            ) : (
              <p className="text-xs text-gray-400 mt-1">{totalStats.totalRequests} requests</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Models List */}
      <div className="grid grid-cols-1 gap-4">
        {modelsLoading &&
          [1, 2, 3].map((i) => (
            <Card key={i} className="glass card-hover highlight-top">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <Skeleton className="w-3 h-3 rounded-full mt-2" />
                  <div className="space-y-2">
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-4 w-64" />
                    <div className="flex items-center gap-2 mt-2">
                      <Skeleton className="h-6 w-36" />
                      <Skeleton className="h-6 w-36" />
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-gray-800">
                  {[1, 2, 3, 4].map((j) => (
                    <div key={j} className="space-y-2">
                      <Skeleton className="h-3 w-16" />
                      <Skeleton className="h-6 w-20" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}

        {llmModels?.map((model: Doc<"llmUsage">) => (
          <Card key={model._id} className="glass card-hover highlight-top">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className={`w-3 h-3 rounded-full mt-2 ${getStatusColor(model.status)}`} />
                  <div>
                    <h3 className="text-lg font-semibold text-white">{model.model}</h3>
                    <p className="text-sm text-gray-400">
                      {model.provider} • {model.description}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs px-2 py-1 rounded bg-white/[0.06] text-gray-300">
                        Input: ${model.costPerInputToken}/1K tokens
                      </span>
                      <span className="text-xs px-2 py-1 rounded bg-white/[0.06] text-gray-300">
                        Output: ${model.costPerOutputToken}/1K tokens
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label="Edit model"
                    onClick={() => handleEdit(model)}
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label="Delete model"
                    onClick={() => handleDelete(model._id)}
                    className="text-red-400 hover:text-red-300"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-gray-800">
                <div>
                  <p className="text-xs text-gray-500">Total Cost</p>
                  <p className="text-lg font-semibold text-white">
                    {formatCurrency(model.totalCost)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Input Tokens</p>
                  <p className="text-lg font-semibold text-white">
                    {formatNumber(model.inputTokensUsed)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Output Tokens</p>
                  <p className="text-lg font-semibold text-white">
                    {formatNumber(model.outputTokensUsed)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Requests</p>
                  <p className="text-lg font-semibold text-white">
                    {formatNumber(model.requestsCount)}
                  </p>
                  {model.budgetLimit && model.totalCost > model.budgetLimit * 0.8 && (
                    <div className="flex items-center gap-1 mt-1">
                      <AlertCircle className="w-3 h-3 text-yellow-400" />
                      <span className="text-xs text-yellow-400">80% budget</span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {!modelsLoading && !llmModels?.length && (
          <Card className="glass card-hover highlight-top">
            <CardContent className="p-8 text-center">
              <Cpu className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">No LLM models configured yet.</p>
              <p className="text-sm text-gray-500 mt-2">Add your first model to track usage and costs.</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingModel ? "Edit Model" : "Add New Model"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Model Name</Label>
                <Input
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                  placeholder="claude-opus-4.5"
                  disabled={!!editingModel}
                  className="bg-white/[0.03] border-white/[0.08]"
                />
              </div>
              <div className="space-y-2">
                <Label>Provider</Label>
                <Select
                  value={formData.provider}
                  onValueChange={(v) => setFormData({ ...formData, provider: v })}
                  disabled={!!editingModel}
                >
                  <SelectTrigger className="bg-white/[0.03] border-white/[0.08]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    <SelectItem value="anthropic">Anthropic</SelectItem>
                    <SelectItem value="openai">OpenAI</SelectItem>
                    <SelectItem value="moonshot">Moonshot (Kimi)</SelectItem>
                    <SelectItem value="google">Google</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Input Cost ($/1K tokens)</Label>
                <Input
                  type="number"
                  step="0.0001"
                  value={formData.costPerInputToken}
                  onChange={(e) => setFormData({ ...formData, costPerInputToken: parseFloat(e.target.value) })}
                  className="bg-white/[0.03] border-white/[0.08]"
                />
              </div>
              <div className="space-y-2">
                <Label>Output Cost ($/1K tokens)</Label>
                <Input
                  type="number"
                  step="0.0001"
                  value={formData.costPerOutputToken}
                  onChange={(e) => setFormData({ ...formData, costPerOutputToken: parseFloat(e.target.value) })}
                  className="bg-white/[0.03] border-white/[0.08]"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Monthly Budget Limit ($) - Optional</Label>
              <Input
                type="number"
                value={formData.budgetLimit || ""}
                onChange={(e) => setFormData({ ...formData, budgetLimit: e.target.value ? parseFloat(e.target.value) : 0 })}
                placeholder="e.g., 1000"
                className="bg-white/[0.03] border-white/[0.08]"
              />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="e.g., High-performance reasoning model"
                className="bg-white/[0.03] border-white/[0.08]"
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleSubmit}
                disabled={!formData.model || !formData.provider}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {editingModel ? "Update" : "Add Model"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      {confirmDialog}
    </div>
  );
}
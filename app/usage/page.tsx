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
import { Badge } from "@/components/ui/badge";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { formatCurrency } from "@/lib/utils";
import { accentBg, accentText, type AccentName } from "@/lib/status-colors";
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

const PROVIDER_ACCENT: Record<string, AccentName> = {
  anthropic: "orange",
  openai: "teal",
  moonshot: "purple",
  ollama: "purple",
};

const STATUS_ACCENT: Record<string, AccentName> = {
  active: "green",
  paused: "orange",
  deprecated: "gray",
};

function getProviderAccent(provider: string): AccentName {
  return PROVIDER_ACCENT[provider.toLowerCase()] ?? "gray";
}

function getStatusAccent(status: string): AccentName {
  return STATUS_ACCENT[status] ?? "gray";
}

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

  return (
    <div className="space-y-6">
      <PageHeader title="Usage & Costs" subtitle="Track LLM spending and token usage">
        <Button onClick={handleCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Add Model
        </Button>
      </PageHeader>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted">Total Spend</CardTitle>
            <div className="p-2 rounded-lg bg-accent-green-tint">
              <DollarSign className="w-4 h-4 text-accent-green" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums tracking-tight text-foreground">
              {statsLoading ? <Skeleton className="h-8 w-20" /> : formatCurrency(totalStats.totalCost)}
            </div>
            <p className="text-xs text-muted mt-1">Across all models</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted">Input Tokens</CardTitle>
            <div className="p-2 rounded-lg bg-accent-blue-tint">
              <TrendingUp className="w-4 h-4 text-accent-blue" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums tracking-tight text-foreground">
              {statsLoading ? <Skeleton className="h-8 w-20" /> : formatNumber(totalStats.totalInputTokens)}
            </div>
            <p className="text-xs text-muted mt-1">Total consumed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted">Output Tokens</CardTitle>
            <div className="p-2 rounded-lg bg-accent-purple-tint">
              <Activity className="w-4 h-4 text-accent-purple" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums tracking-tight text-foreground">
              {statsLoading ? <Skeleton className="h-8 w-20" /> : formatNumber(totalStats.totalOutputTokens)}
            </div>
            <p className="text-xs text-muted mt-1">Total generated</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted">Active Models</CardTitle>
            <div className="p-2 rounded-lg bg-accent-yellow-tint">
              <Cpu className="w-4 h-4 text-accent-yellow" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums tracking-tight text-foreground">
              {statsLoading ? <Skeleton className="h-8 w-12" /> : totalStats.modelCount}
            </div>
            {statsLoading ? (
              <Skeleton className="h-4 w-24 mt-1" />
            ) : (
              <p className="text-xs text-muted mt-1">{totalStats.totalRequests} requests</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Models List */}
      <div className="grid grid-cols-1 gap-4">
        {modelsLoading &&
          [1, 2, 3].map((i) => (
            <Card key={i}>
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
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-separator">
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
          <Card key={model._id}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className={`w-3 h-3 rounded-full mt-2 ${accentBg[getStatusAccent(model.status)]}`} />
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">{model.model}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge color={getProviderAccent(model.provider)}>{model.provider}</Badge>
                      <Badge color={getStatusAccent(model.status)}>{model.status}</Badge>
                      {model.description && (
                        <span className="text-sm text-muted">{model.description}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs px-2 py-1 rounded bg-fill text-muted">
                        Input: ${model.costPerInputToken}/1K tokens
                      </span>
                      <span className="text-xs px-2 py-1 rounded bg-fill text-muted">
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
                    className="hover:bg-fill"
                    onClick={() => handleEdit(model)}
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label="Delete model"
                    onClick={() => handleDelete(model._id)}
                    className="hover:bg-accent-red-tint"
                  >
                    <Trash2 className={`w-4 h-4 ${accentText.red}`} />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-separator">
                <div>
                  <p className="text-xs text-tertiary">Total Cost</p>
                  <p className="text-lg font-semibold tabular-nums tracking-tight text-foreground">
                    {formatCurrency(model.totalCost)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-tertiary">Input Tokens</p>
                  <p className="text-lg font-semibold tabular-nums tracking-tight text-foreground">
                    {formatNumber(model.inputTokensUsed)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-tertiary">Output Tokens</p>
                  <p className="text-lg font-semibold tabular-nums tracking-tight text-foreground">
                    {formatNumber(model.outputTokensUsed)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-tertiary">Requests</p>
                  <p className="text-lg font-semibold tabular-nums tracking-tight text-foreground">
                    {formatNumber(model.requestsCount)}
                  </p>
                  {model.budgetLimit && model.totalCost > model.budgetLimit && (
                    <div className="flex items-center gap-1 mt-1">
                      <AlertCircle className="w-3 h-3 text-accent-red" />
                      <span className="text-xs text-accent-red">Over budget</span>
                    </div>
                  )}
                  {model.budgetLimit && model.totalCost > model.budgetLimit * 0.8 && model.totalCost <= model.budgetLimit && (
                    <div className="flex items-center gap-1 mt-1">
                      <AlertCircle className="w-3 h-3 text-accent-orange" />
                      <span className="text-xs text-accent-orange">80% budget</span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {!modelsLoading && !llmModels?.length && (
          <EmptyState
            icon={Cpu}
            message="No LLM models configured yet."
            hint="Add your first model to track usage and costs."
          />
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
                />
              </div>
              <div className="space-y-2">
                <Label>Provider</Label>
                <Select
                  value={formData.provider}
                  onValueChange={(v) => setFormData({ ...formData, provider: v })}
                  disabled={!!editingModel}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
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
                />
              </div>
              <div className="space-y-2">
                <Label>Output Cost ($/1K tokens)</Label>
                <Input
                  type="number"
                  step="0.0001"
                  value={formData.costPerOutputToken}
                  onChange={(e) => setFormData({ ...formData, costPerOutputToken: parseFloat(e.target.value) })}
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
              />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="e.g., High-performance reasoning model"
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!formData.model || !formData.provider}
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

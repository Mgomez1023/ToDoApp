import {
  DndContext,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Check, GripVertical, Plus, Tag } from "lucide-react";
import { useEffect, useMemo, useState, type CSSProperties } from "react";

import { TaskLabels } from "@/components/tasks/TaskLabels";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { getLabelColorStyles, hexToRgba } from "@/lib/colors";
import { LABEL_COLOR_OPTIONS, type Label } from "@/types/label";

interface LabelPickerProps {
  canManage: boolean;
  disabled?: boolean;
  error: string | null;
  isCreatingLabel: boolean;
  labels: Label[];
  onChange: (labelIds: string[]) => void;
  onCreateLabel: (input: { color: string; name: string }) => Promise<Label>;
  value: string[];
}

export function LabelPicker({
  canManage,
  disabled = false,
  error,
  isCreatingLabel,
  labels,
  onChange,
  onCreateLabel,
  value,
}: LabelPickerProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newLabelName, setNewLabelName] = useState("");
  const [newLabelColor, setNewLabelColor] = useState<string>(LABEL_COLOR_OPTIONS[0]);
  const [validationError, setValidationError] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 4,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 120,
        tolerance: 8,
      },
    }),
  );

  const labelsById = useMemo(
    () => new Map(labels.map((label) => [label.id, label])),
    [labels],
  );
  const selectedLabels = useMemo(
    () =>
      value.flatMap((labelId) => {
        const label = labelsById.get(labelId);

        return label ? [label] : [];
      }),
    [labelsById, value],
  );
  const canReorderSelectedLabels =
    canManage && !disabled && selectedLabels.length > 1;

  useEffect(() => {
    if (!canManage) {
      setIsCreateOpen(false);
    }
  }, [canManage]);

  const toggleLabel = (labelId: string) => {
    if (disabled || !canManage) {
      return;
    }

    if (value.includes(labelId)) {
      onChange(value.filter((currentId) => currentId !== labelId));
      return;
    }

    onChange([...value, labelId]);
  };

  const handleSelectedLabelDragEnd = (event: DragEndEvent) => {
    if (!canReorderSelectedLabels || !event.over || event.active.id === event.over.id) {
      return;
    }

    const currentIndex = value.indexOf(String(event.active.id));
    const nextIndex = value.indexOf(String(event.over.id));

    if (currentIndex < 0 || nextIndex < 0 || currentIndex === nextIndex) {
      return;
    }

    onChange(arrayMove(value, currentIndex, nextIndex));
  };

  const handleCreateLabel = async () => {
    const normalizedName = newLabelName.trim();

    if (normalizedName.length === 0) {
      setValidationError("Label name is required.");
      return;
    }

    setValidationError(null);

    try {
      const nextLabel = await onCreateLabel({
        color: newLabelColor,
        name: normalizedName,
      });

      setNewLabelName("");
      setNewLabelColor(LABEL_COLOR_OPTIONS[0]);
      setIsCreateOpen(false);

      if (!value.includes(nextLabel.id)) {
        onChange([...value, nextLabel.id]);
      }
    } catch {
      return;
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <label className="text-sm font-medium text-ink">Labels</label>
          <p className="mt-1 text-xs leading-5 text-ink-muted">
            Labels will be 
          </p>
        </div>

        {canManage ? (
          <Button
            disabled={disabled}
            onClick={() => setIsCreateOpen((currentValue) => !currentValue)}
            size="sm"
            type="button"
            variant="ghost"
          >
            <Plus className="size-4" />
            New label
          </Button>
        ) : null}
      </div>

      <div className="rounded-2xl border border-line/80 bg-slate-50/85 px-4 py-3">
        {selectedLabels.length > 0 ? (
          canManage ? (
            <DndContext
              collisionDetection={closestCenter}
              onDragEnd={handleSelectedLabelDragEnd}
              sensors={sensors}
            >
              <SortableContext
                items={selectedLabels.map((label) => label.id)}
                strategy={rectSortingStrategy}
              >
                <div className="flex flex-wrap gap-2">
                  {selectedLabels.map((label) => (
                    <SortableSelectedLabel
                      disabled={!canReorderSelectedLabels}
                      key={label.id}
                      label={label}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          ) : (
            <TaskLabels labels={selectedLabels} size="md" />
          )
        ) : (
          <div className="flex items-center gap-2 text-sm text-ink-muted">
            <Tag className="size-4" />
            No labels on this task yet.
          </div>
        )}
      </div>

      {canManage ? (
        labels.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {labels.map((label) => {
              const isSelected = value.includes(label.id);

              return (
                <button
                  className={cn(
                    "inline-flex items-center rounded-full border px-2.5 py-1.5 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-white",
                    disabled && "cursor-not-allowed opacity-60",
                  )}
                  disabled={disabled}
                  key={label.id}
                  onClick={() => toggleLabel(label.id)}
                  style={
                    isSelected
                      ? {
                          backgroundColor: hexToRgba(label.color, 0.18),
                          borderColor: hexToRgba(label.color, 0.38),
                          color: label.color,
                        }
                      : getLabelColorStyles(label.color)
                  }
                  type="button"
                >
                  {label.name}
                </button>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-line bg-white/70 px-4 py-4 text-sm text-ink-muted">
            Create the first label here and reuse it across tasks.
          </div>
        )
      ) : null}

      {canManage && isCreateOpen ? (
        <div className="space-y-3 rounded-2xl border border-transparent bg-white/80 p-4 shadow-card">
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-soft">
              Label name
            </label>
            <input
              className="h-11 w-full rounded-xl border border-line bg-slate-50 px-3 text-sm text-ink outline-none transition focus:border-accent focus:ring-4 focus:ring-blue-100"
              disabled={disabled || isCreatingLabel}
              onChange={(event) => setNewLabelName(event.target.value)}
              placeholder="Bug"
              type="text"
              value={newLabelName}
            />
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-soft">
              Color
            </p>
            <div className="flex flex-wrap gap-2">
              {LABEL_COLOR_OPTIONS.map((color) => {
                const isSelected = color === newLabelColor;

                return (
                  <button
                    aria-label={`Use ${color} for the label`}
                    className={cn(
                      "flex size-8 items-center justify-center rounded-full border-2 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-white",
                      isSelected
                        ? "scale-110 border-white shadow-card ring-2 ring-ink/20 ring-offset-2 ring-offset-canvas"
                        : "border-white/80 hover:scale-105",
                    )}
                    disabled={disabled || isCreatingLabel}
                    key={color}
                    onClick={() => setNewLabelColor(color)}
                    style={{ backgroundColor: color }}
                    type="button"
                  >
                    {isSelected ? (
                      <Check className="size-3.5 text-white drop-shadow-[0_1px_2px_rgba(15,23,42,0.45)]" />
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>

          {validationError || error ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {validationError ?? error}
            </div>
          ) : null}

          <div className="flex flex-wrap justify-end gap-2">
            <Button
              disabled={disabled || isCreatingLabel}
              onClick={() => {
                setIsCreateOpen(false);
                setValidationError(null);
              }}
              size="sm"
              type="button"
              variant="secondary"
            >
              Cancel
            </Button>
            <Button
              disabled={disabled || isCreatingLabel}
              onClick={() => void handleCreateLabel()}
              size="sm"
              type="button"
            >
              {isCreatingLabel ? "Creating..." : "Create label"}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

interface SortableSelectedLabelProps {
  disabled: boolean;
  label: Label;
}

function SortableSelectedLabel({
  disabled,
  label,
}: SortableSelectedLabelProps) {
  const {
    attributes,
    isDragging,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({
    disabled,
    id: label.id,
  });

  return (
    <button
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={cn(
        "inline-flex select-none items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-xs font-semibold shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-white",
        disabled ? "cursor-default" : "cursor-grab touch-none active:cursor-grabbing",
        isDragging && "z-10 shadow-card ring-1 ring-slate-950/10",
      )}
      style={{
        ...getLabelColorStyles(label.color),
        transform: CSS.Transform.toString(transform),
        transition,
      } as CSSProperties}
      title={disabled ? label.name : `Drag to reorder ${label.name}`}
      type="button"
    >
      <GripVertical className="size-3.5 opacity-70" />
      <span>{label.name}</span>
    </button>
  );
}

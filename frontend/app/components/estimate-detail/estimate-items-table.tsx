import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Trash2, GripVertical } from "lucide-react";
import { GroupManager } from "@/components/estimate-detail/group-manager";
import type { Estimate, EstimateItem, ItemCategory } from "@/lib/types";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  restrictToVerticalAxis,
  restrictToParentElement,
} from "@dnd-kit/modifiers";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface EstimateItemsTableProps {
  estimate: Estimate;
  categories: ItemCategory[];
  groups: string[];
  onGroupsChange: (groups: string[]) => void;
  onItemChange: (
    index: number,
    field: keyof EstimateItem,
    value: string | number,
  ) => void;
  onAddItem: () => void;
  onRemoveItem: (index: number) => void;
  onReorderItems: (startIndex: number, endIndex: number) => void;
}

interface SortableRowProps {
  item: EstimateItem;
  index: number;
  categories: ItemCategory[];
  canRemove: boolean;
  onItemChange: (
    index: number,
    field: keyof EstimateItem,
    value: string | number,
  ) => void;
  onRemoveItem: (index: number) => void;
}

function SortableRow({
  item,
  index,
  categories,
  canRemove,
  onItemChange,
  onRemoveItem,
}: SortableRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <TableRow ref={setNodeRef} style={style} className="group">
      <TableCell className="p-2 w-8">
        <button
          className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground touch-none flex items-center justify-center h-full"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="w-4 h-4" />
        </button>
      </TableCell>
      <TableCell className="p-2">
        <div className="min-w-0">
          <Select
            value={item.category_id}
            onValueChange={(value) => onItemChange(index, "category_id", value)}
          >
            <SelectTrigger className="h-9 text-sm w-full max-w-full">
              <div className="truncate overflow-hidden text-left">
                <SelectValue placeholder="選択" />
              </div>
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </TableCell>
      <TableCell className="p-2">
        <Input
          value={item.item_name}
          onChange={(e) => onItemChange(index, "item_name", e.target.value)}
          placeholder="品目名"
          className="h-9 text-sm"
        />
      </TableCell>
      <TableCell className="p-2">
        <Input
          type="number"
          value={item.quantity}
          onChange={(e) =>
            onItemChange(index, "quantity", Number(e.target.value))
          }
          placeholder="1"
          min="1"
          className="h-9 text-sm text-right"
        />
      </TableCell>
      <TableCell className="p-2">
        <Input
          type="number"
          value={item.price}
          onChange={(e) => onItemChange(index, "price", Number(e.target.value))}
          placeholder="0"
          min="0"
          className="h-9 text-sm text-right"
        />
      </TableCell>
      <TableCell className="p-2">
        <div className="flex items-center justify-end gap-2">
          <span className="text-sm font-medium tabular text-right">
            ¥{item.subtotal.toLocaleString()}
          </span>
          {canRemove && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onRemoveItem(index)}
              className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}

export function EstimateItemsTable({
  estimate,
  categories,
  groups,
  onGroupsChange,
  onItemChange,
  onAddItem,
  onRemoveItem,
  onReorderItems,
}: EstimateItemsTableProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const items = estimate.items || [];
      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over.id);
      onReorderItems(oldIndex, newIndex);
    }
  };

  const items = estimate.items || [];

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">明細項目</h2>
        <GroupManager groups={groups} onGroupsChange={onGroupsChange} />
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
        modifiers={[restrictToVerticalAxis, restrictToParentElement]}
      >
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="w-8"></TableHead>
              <TableHead className="w-[20%] text-center">グループ</TableHead>
              <TableHead className="w-[26%] text-center">品目</TableHead>
              <TableHead className="w-[12%] text-center">数量</TableHead>
              <TableHead className="w-[20%] text-center">単価</TableHead>
              <TableHead className="w-[22%] text-right">金額</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <SortableContext
              items={items.map((item) => item.id)}
              strategy={verticalListSortingStrategy}
            >
              {items.map((item, index) => (
                <SortableRow
                  key={item.id}
                  item={item}
                  index={index}
                  categories={categories}
                  canRemove={items.length > 1}
                  onItemChange={onItemChange}
                  onRemoveItem={onRemoveItem}
                />
              ))}
            </SortableContext>
          </TableBody>
        </Table>
      </DndContext>

      <div className="flex justify-end">
        <Button size="sm" onClick={onAddItem}>
          <Plus className="w-4 h-4 mr-1" />
          行を追加
        </Button>
      </div>

      <div className="p-4 bg-muted/30 rounded-lg border space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">小計</span>
          <span className="font-medium tabular-nums">
            ¥
            {items
              .reduce((sum, item) => sum + item.subtotal, 0)
              .toLocaleString()}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">消費税(10%)</span>
          <span className="font-medium tabular-nums">
            ¥
            {Math.floor(
              items.reduce((sum, item) => sum + item.subtotal, 0) * 0.1,
            ).toLocaleString()}
          </span>
        </div>
        <div className="flex justify-between text-lg font-bold pt-2 border-t">
          <span>合計</span>
          <span className="text-primary tabular-nums">
            ¥
            {Math.floor(
              items.reduce((sum, item) => sum + item.subtotal, 0) * 1.1,
            ).toLocaleString()}
          </span>
        </div>
      </div>
    </Card>
  );
}

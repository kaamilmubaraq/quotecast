import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Settings, Trash2, Pencil, Check, X } from "lucide-react";

interface GroupManagerProps {
  groups: string[];
  onGroupsChange: (groups: string[]) => void;
}

export function GroupManager({
  groups = [],
  onGroupsChange,
}: GroupManagerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [newGroup, setNewGroup] = useState("");
  const [editingGroup, setEditingGroup] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState("");

  const addGroup = () => {
    if (newGroup.trim() && !groups.includes(newGroup.trim())) {
      onGroupsChange([...groups, newGroup.trim()]);
      setNewGroup("");
    }
  };

  const removeGroup = (group: string) => {
    onGroupsChange(groups.filter((g) => g !== group));
  };

  const startEdit = (group: string) => {
    setEditingGroup(group);
    setEditingValue(group);
  };

  const cancelEdit = () => {
    setEditingGroup(null);
    setEditingValue("");
  };

  const saveEdit = () => {
    if (editingValue.trim() && editingGroup) {
      const updatedGroups = groups.map((g) =>
        g === editingGroup ? editingValue.trim() : g,
      );
      onGroupsChange(updatedGroups);
      setEditingGroup(null);
      setEditingValue("");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Settings className="w-4 h-4 mr-2" />
          グループ管理
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>グループ管理</DialogTitle>
          <DialogDescription>
            明細項目のグループを追加・削除できます
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex gap-2">
            <div className="flex-1 space-y-2">
              <Label htmlFor="newGroup">新しいグループ</Label>
              <Input
                id="newGroup"
                value={newGroup}
                onChange={(e) => setNewGroup(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.nativeEvent.isComposing) {
                    addGroup();
                  }
                }}
                placeholder="例: 設計、開発、テスト"
              />
            </div>
            <Button onClick={addGroup} size="sm" className="mt-auto">
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          <div className="space-y-2">
            <Label>登録済みグループ</Label>
            {groups.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                グループが登録されていません
              </p>
            ) : (
              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                {groups.map((group) => (
                  <div
                    key={group}
                    className="flex items-center gap-2 p-2 border rounded-lg bg-muted/30"
                  >
                    {editingGroup === group ? (
                      <>
                        <Input
                          value={editingValue}
                          onChange={(e) => setEditingValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (
                              e.key === "Enter" &&
                              !e.nativeEvent.isComposing
                            ) {
                              saveEdit();
                            }
                            if (e.key === "Escape") cancelEdit();
                          }}
                          className="h-7 text-sm flex-1"
                          autoFocus
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={saveEdit}
                          className="h-7 w-7 p-0"
                        >
                          <Check className="w-3.5 h-3.5 text-green-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={cancelEdit}
                          className="h-7 w-7 p-0"
                        >
                          <X className="w-3.5 h-3.5 text-gray-600" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <span className="text-sm flex-1">{group}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => startEdit(group)}
                          className="h-7 w-7 p-0"
                        >
                          <Pencil className="w-3.5 h-3.5 text-blue-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeGroup(group)}
                          className="h-7 w-7 p-0"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-destructive" />
                        </Button>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button onClick={() => setIsOpen(false)}>閉じる</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

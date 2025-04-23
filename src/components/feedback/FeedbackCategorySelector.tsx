import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Check, ChevronsUpDown, Plus, Tag, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface FeedbackCategory {
  id: string;
  name: string;
  description?: string;
  color?: string;
}

interface FeedbackCategorySelectorProps {
  selectedCategories: FeedbackCategory[];
  availableCategories: FeedbackCategory[];
  suggestedCategories?: FeedbackCategory[];
  onCategoriesChange: (categories: FeedbackCategory[]) => void;
  onCreateCategory?: (
    category: Omit<FeedbackCategory, "id">,
  ) => Promise<FeedbackCategory>;
  maxCategories?: number;
  projectId?: string;
  disabled?: boolean;
}

const defaultColors = [
  "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400",
  "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400",
  "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400",
];

const FeedbackCategorySelector: React.FC<FeedbackCategorySelectorProps> = ({
  selectedCategories = [],
  availableCategories = [],
  suggestedCategories = [],
  onCategoriesChange,
  onCreateCategory,
  maxCategories = 5,
  projectId,
  disabled = false,
}) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newCategory, setNewCategory] = useState({
    name: "",
    description: "",
    color: defaultColors[0],
  });
  const [isCreating, setIsCreating] = useState(false);

  // Filter out already selected categories
  const filteredCategories = availableCategories.filter(
    (category) =>
      !selectedCategories.some((selected) => selected.id === category.id),
  );

  // Filter suggested categories that aren't already selected
  const filteredSuggestions = suggestedCategories.filter(
    (category) =>
      !selectedCategories.some((selected) => selected.id === category.id),
  );

  const handleSelectCategory = (category: FeedbackCategory) => {
    if (selectedCategories.length < maxCategories) {
      onCategoriesChange([...selectedCategories, category]);
    }
    setOpen(false);
  };

  const handleRemoveCategory = (categoryId: string) => {
    onCategoriesChange(
      selectedCategories.filter((cat) => cat.id !== categoryId),
    );
  };

  const handleCreateCategory = async () => {
    if (!newCategory.name.trim() || !onCreateCategory) return;

    try {
      setIsCreating(true);
      const createdCategory = await onCreateCategory({
        name: newCategory.name.trim(),
        description: newCategory.description.trim(),
        color: newCategory.color,
      });

      // Add the new category to selected categories
      onCategoriesChange([...selectedCategories, createdCategory]);

      // Reset form and close dialog
      setNewCategory({ name: "", description: "", color: defaultColors[0] });
      setCreateDialogOpen(false);
    } catch (error) {
      console.error("Error creating category:", error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleAcceptSuggestion = (category: FeedbackCategory) => {
    if (selectedCategories.length < maxCategories) {
      onCategoriesChange([...selectedCategories, category]);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2 mb-2">
        {selectedCategories.map((category) => (
          <Badge
            key={category.id}
            variant="outline"
            className={`${category.color || defaultColors[0]} flex items-center gap-1 px-3 py-1`}
          >
            {category.name}
            <Button
              variant="ghost"
              size="icon"
              className="h-4 w-4 p-0 ml-1 hover:bg-transparent"
              onClick={() => handleRemoveCategory(category.id)}
              disabled={disabled}
            >
              <X className="h-3 w-3" />
            </Button>
          </Badge>
        ))}

        {selectedCategories.length < maxCategories && !disabled && (
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1 text-muted-foreground"
                disabled={disabled}
              >
                <Tag className="h-4 w-4" />
                Add Category
                <ChevronsUpDown className="h-3 w-3 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0" align="start">
              <Command>
                <CommandInput
                  placeholder="Search categories..."
                  value={search}
                  onValueChange={setSearch}
                />
                <CommandEmpty className="py-2 px-4 text-sm">
                  <div className="text-center space-y-2">
                    <p>No categories found</p>
                    {onCreateCategory && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full gap-1"
                        onClick={() => {
                          setCreateDialogOpen(true);
                          setOpen(false);
                          setNewCategory((prev) => ({ ...prev, name: search }));
                        }}
                      >
                        <Plus className="h-3 w-3" />
                        Create "{search}"
                      </Button>
                    )}
                  </div>
                </CommandEmpty>

                <CommandGroup heading="Suggested Categories">
                  {filteredSuggestions.length > 0 ? (
                    <ScrollArea className="max-h-[120px]">
                      {filteredSuggestions.map((category) => (
                        <CommandItem
                          key={category.id}
                          value={category.id}
                          onSelect={() => handleSelectCategory(category)}
                          className="flex items-center justify-between"
                        >
                          <div className="flex items-center gap-2">
                            <Badge
                              variant="outline"
                              className={`${category.color || defaultColors[0]} px-2 py-0`}
                            >
                              {category.name}
                            </Badge>
                            {category.description && (
                              <span className="text-xs text-muted-foreground truncate max-w-[150px]">
                                {category.description}
                              </span>
                            )}
                          </div>
                          <Check
                            className={cn(
                              "h-4 w-4",
                              selectedCategories.some(
                                (c) => c.id === category.id,
                              )
                                ? "opacity-100"
                                : "opacity-0",
                            )}
                          />
                        </CommandItem>
                      ))}
                    </ScrollArea>
                  ) : (
                    <div className="py-2 px-4 text-sm text-muted-foreground">
                      No suggestions available
                    </div>
                  )}
                </CommandGroup>

                <CommandGroup heading="All Categories">
                  {filteredCategories.length > 0 ? (
                    <ScrollArea className="max-h-[200px]">
                      {filteredCategories.map((category) => (
                        <CommandItem
                          key={category.id}
                          value={category.id}
                          onSelect={() => handleSelectCategory(category)}
                          className="flex items-center justify-between"
                        >
                          <div className="flex items-center gap-2">
                            <Badge
                              variant="outline"
                              className={`${category.color || defaultColors[0]} px-2 py-0`}
                            >
                              {category.name}
                            </Badge>
                            {category.description && (
                              <span className="text-xs text-muted-foreground truncate max-w-[150px]">
                                {category.description}
                              </span>
                            )}
                          </div>
                          <Check
                            className={cn(
                              "h-4 w-4",
                              selectedCategories.some(
                                (c) => c.id === category.id,
                              )
                                ? "opacity-100"
                                : "opacity-0",
                            )}
                          />
                        </CommandItem>
                      ))}
                    </ScrollArea>
                  ) : (
                    <div className="py-2 px-4 text-sm text-muted-foreground">
                      No categories available
                    </div>
                  )}
                </CommandGroup>

                {onCreateCategory && (
                  <div className="p-2 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full gap-1"
                      onClick={() => {
                        setCreateDialogOpen(true);
                        setOpen(false);
                      }}
                    >
                      <Plus className="h-3 w-3" />
                      Create New Category
                    </Button>
                  </div>
                )}
              </Command>
            </PopoverContent>
          </Popover>
        )}
      </div>

      {/* Suggested categories section */}
      {filteredSuggestions.length > 0 &&
        selectedCategories.length < maxCategories &&
        !disabled && (
          <div className="mt-2">
            <p className="text-sm text-muted-foreground mb-1">
              Suggested categories:
            </p>
            <div className="flex flex-wrap gap-2">
              {filteredSuggestions.slice(0, 5).map((category) => (
                <Badge
                  key={category.id}
                  variant="outline"
                  className={`${category.color || defaultColors[0]} cursor-pointer hover:opacity-80`}
                  onClick={() => handleAcceptSuggestion(category)}
                >
                  {category.name}
                  <Plus className="h-3 w-3 ml-1" />
                </Badge>
              ))}
            </div>
          </div>
        )}

      {/* Create category dialog */}
      {onCreateCategory && (
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Category</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="category-name">Category Name</Label>
                <Input
                  id="category-name"
                  placeholder="Enter category name"
                  value={newCategory.name}
                  onChange={(e) =>
                    setNewCategory({ ...newCategory, name: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category-description">
                  Description (optional)
                </Label>
                <Input
                  id="category-description"
                  placeholder="Enter category description"
                  value={newCategory.description}
                  onChange={(e) =>
                    setNewCategory({
                      ...newCategory,
                      description: e.target.value,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Color</Label>
                <div className="flex flex-wrap gap-2">
                  {defaultColors.map((color, index) => (
                    <Button
                      key={index}
                      type="button"
                      variant="outline"
                      className={`h-8 w-8 p-0 rounded-full ${color} ${newCategory.color === color ? "ring-2 ring-offset-2 ring-primary" : ""}`}
                      onClick={() => setNewCategory({ ...newCategory, color })}
                    />
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setCreateDialogOpen(false)}
                disabled={isCreating}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateCategory}
                disabled={!newCategory.name.trim() || isCreating}
              >
                {isCreating ? "Creating..." : "Create Category"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default FeedbackCategorySelector;

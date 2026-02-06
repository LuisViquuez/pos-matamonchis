"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CategoryFilterProps {
  categories: string[];
  selected: string;
  onSelect: (category: string) => void;
}

const categoryLabels: Record<string, string> = {
  all: "Todos",
  Gomitas: "Gomitas",
  Paletas: "Paletas",
  Chocolates: "Chocolates",
  Chicles: "Chicles",
  Caramelos: "Caramelos",
  "Dulces Típicos": "D. Típicos",
};

export function CategoryFilter({
  categories,
  selected,
  onSelect,
}: CategoryFilterProps) {
  return (
    <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
      {categories.map((category) => (
        <Button
          key={category}
          variant={selected === category ? "default" : "outline"}
          size="sm"
          onClick={() => onSelect(category)}
          className={cn(
            "flex-shrink-0 text-xs",
            selected === category && "shadow-sm"
          )}
        >
          {categoryLabels[category] || category}
        </Button>
      ))}
    </div>
  );
}

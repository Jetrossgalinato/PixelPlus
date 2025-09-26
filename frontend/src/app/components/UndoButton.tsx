"use client";
import { RotateCcw } from "lucide-react";
import React, { useEffect } from "react";

type UndoButtonProps = {
  onClick: () => void;
  disabled?: boolean;
};

export default function UndoButton({ onClick, disabled }: UndoButtonProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !disabled) {
        onClick();
        e.preventDefault();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClick, disabled]);
  return (
    <button
      className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-lg shadow hover:bg-gray-700 transition disabled:opacity-50"
      onClick={onClick}
      disabled={disabled}
      style={{ minWidth: 60 }}
      title="Undo all edits"
    >
      <RotateCcw className="w-4 h-4" /> Undo
    </button>
  );
}

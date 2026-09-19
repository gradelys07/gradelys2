import { AIOperation } from "./types";
import { usePresentationStore } from "./store";
import { nanoid } from "nanoid";

export function applyAIOperations(operations: AIOperation[]) {
  const store = usePresentationStore.getState();
  const { document, updateSlide, updateElement, addElement, deleteElement, addSlide, deleteSlide, updateTheme } = store;

  if (!document) return;

  for (const op of operations) {
    try {
      switch (op.action) {
        case "update_element":
          if (!op.targetId) continue;
          // Find slide containing this element
          const slideForUpdate = document.slides.find(s => s.elements.some(e => e.id === op.targetId));
          if (slideForUpdate && op.changes) {
            updateElement(slideForUpdate.id, op.targetId, op.changes);
          }
          break;
          
        case "add_element":
          if (!op.targetId || !op.changes) continue; // targetId is slideId here
          addElement(op.targetId, {
            ...op.changes,
            id: nanoid(), // Ensure new ID
          } as any);
          break;
          
        case "delete_element":
          if (!op.targetId) continue;
          const slideForDelete = document.slides.find(s => s.elements.some(e => e.id === op.targetId));
          if (slideForDelete) {
            deleteElement(slideForDelete.id, op.targetId);
          }
          break;
          
        case "change_layout":
          if (!op.targetId || !op.changes?.layout) continue;
          updateSlide(op.targetId, { layout: op.changes.layout });
          break;
          
        case "change_theme":
          if (!op.changes) continue;
          updateTheme(op.changes);
          break;

        case "add_slide":
          addSlide({
            id: nanoid(),
            layout: op.changes?.layout || "blank",
            background: op.changes?.background || { type: "solid", value: "#ffffff" },
            elements: op.changes?.elements || []
          });
          break;

        case "delete_slide":
          if (op.targetId) {
            deleteSlide(op.targetId);
          }
          break;
      }
    } catch (e) {
      console.error("Failed to apply AI operation", op, e);
    }
  }
}

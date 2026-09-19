"use client";

import React from "react";
import { usePresentationStore } from "./store";
import { PresentationElement } from "./types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

function ChartDataEditor({ element, onChange }: { element: any, onChange: (k: string, v: any) => void }) {
  const labels = element.properties.labels || [];
  const datasets = element.properties.datasets || [];

  const handleLabelChange = (index: number, val: string) => {
    const newLabels = [...labels];
    newLabels[index] = val;
    onChange("labels", newLabels);
  };

  const handleDataChange = (dsIndex: number, rowIdx: number, val: number) => {
    const newDatasets = [...datasets];
    newDatasets[dsIndex] = { ...newDatasets[dsIndex] };
    const newValues = [...newDatasets[dsIndex].values];
    newValues[rowIdx] = val;
    newDatasets[dsIndex].values = newValues;
    onChange("datasets", newDatasets);
  };

  const handleDatasetNameChange = (dsIndex: number, val: string) => {
    const newDatasets = [...datasets];
    newDatasets[dsIndex] = { ...newDatasets[dsIndex], label: val };
    onChange("datasets", newDatasets);
  };

  const handleDatasetColorChange = (dsIndex: number, val: string) => {
    const newDatasets = [...datasets];
    newDatasets[dsIndex] = { ...newDatasets[dsIndex], color: val };
    onChange("datasets", newDatasets);
  };

  const handleAddRow = () => {
    onChange("labels", [...labels, `Item ${labels.length + 1}`]);
    const newDatasets = datasets.map((ds: any) => ({ ...ds, values: [...ds.values, 0] }));
    onChange("datasets", newDatasets);
  };

  const handleRemoveRow = (idx: number) => {
    onChange("labels", labels.filter((_:any, i:number) => i !== idx));
    const newDatasets = datasets.map((ds: any) => ({ ...ds, values: ds.values.filter((_:any, i:number) => i !== idx) }));
    onChange("datasets", newDatasets);
  };

  const handleAddDataset = () => {
    const newDatasets = [...datasets, { label: `Series ${datasets.length + 1}`, values: labels.map(() => 0), color: "#0088fe" }];
    onChange("datasets", newDatasets);
  };

  const handleRemoveDataset = (idx: number) => {
    const newDatasets = [...datasets];
    newDatasets.splice(idx, 1);
    onChange("datasets", newDatasets);
  };

  return (
    <div className="mt-4 border-t pt-4">
      <label className="text-xs font-semibold text-gray-700 mb-2 block">Chart Data</label>
      <div className="overflow-x-auto pb-2">
        <table className="w-full text-xs text-left border-collapse min-w-[300px]">
          <thead>
            <tr>
              <th className="border-b p-1 font-medium text-gray-500 w-24">Labels</th>
              {datasets.map((ds: any, i: number) => (
                <th key={i} className="border-b p-1 font-medium text-gray-500 min-w-[80px]">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between px-1">
                       <input type="color" className="w-4 h-4 p-0 border-0 cursor-pointer bg-transparent" value={ds.color || "#0088fe"} onChange={e => handleDatasetColorChange(i, e.target.value)} />
                       <button onClick={() => handleRemoveDataset(i)} className="text-red-500 text-[10px] font-bold">&times;</button>
                    </div>
                    <input className="w-full border rounded px-1 h-6 text-[10px]" value={ds.label} onChange={e => handleDatasetNameChange(i, e.target.value)} />
                  </div>
                </th>
              ))}
              <th className="border-b p-1 w-6"><button onClick={handleAddDataset} className="text-blue-500 whitespace-nowrap text-lg font-bold leading-none" title="Add Dataset">+</button></th>
            </tr>
          </thead>
          <tbody>
            {labels.map((label: string, rowIdx: number) => (
              <tr key={rowIdx}>
                <td className="p-1 border-b">
                  <input className="w-full border rounded px-1 h-6 text-[10px]" value={label} onChange={e => handleLabelChange(rowIdx, e.target.value)} />
                </td>
                {datasets.map((ds: any, dsIdx: number) => (
                  <td key={dsIdx} className="p-1 border-b">
                    <input type="number" className="w-full border rounded px-1 h-6 text-[10px]" value={ds.values[rowIdx] ?? 0} onChange={e => handleDataChange(dsIdx, rowIdx, Number(e.target.value))} />
                  </td>
                ))}
                <td className="p-1 border-b text-center">
                  <button onClick={() => handleRemoveRow(rowIdx)} className="text-red-500 text-lg font-bold leading-none">&times;</button>
                </td>
              </tr>
            ))}
            <tr>
              <td colSpan={datasets.length + 2} className="p-1">
                <button onClick={handleAddRow} className="text-blue-500 text-[10px] font-medium w-full text-left py-1 hover:underline">+ Add Row</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function PropertiesPanel() {
  const { document, activeSlideId, selectedElementIds, updateElement } = usePresentationStore();

  if (!document || !activeSlideId) return null;
  const slide = document.slides.find(s => s.id === activeSlideId);
  if (!slide) return null;

  const selectedElements = slide.elements.filter(e => selectedElementIds.includes(e.id));
  if (selectedElements.length === 0) {
    return (
      <div className="w-64 h-full border-l bg-white flex flex-col items-center justify-center text-sm text-gray-500">
        <p>No element selected</p>
      </div>
    );
  }

  if (selectedElements.length > 1) {
    return (
      <div className="w-64 h-full border-l bg-white flex flex-col items-center justify-center text-sm text-gray-500">
        <p>Multiple elements selected</p>
      </div>
    );
  }

  const element = selectedElements[0];

  const handlePropChange = (key: string, value: any) => {
    updateElement(activeSlideId, element.id, {
      properties: {
        ...element.properties,
        [key]: value
      } as any
    });
  };

  return (
    <div className="w-64 h-full border-l bg-white flex flex-col p-4 overflow-y-auto">
      <h3 className="font-semibold mb-4 text-sm uppercase text-gray-500 tracking-wider">Properties</h3>
      
      <div className="space-y-4">
        {element.type === "text" && (
          <>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Content</label>
              <textarea 
                className="w-full text-sm border rounded p-2 focus:ring-1 focus:ring-blue-500 outline-none"
                rows={4}
                value={element.properties.content}
                onChange={e => handlePropChange("content", e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Font Size</label>
                <Input 
                  type="number"
                  value={element.properties.fontSize}
                  onChange={e => handlePropChange("fontSize", Number(e.target.value))}
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Font Weight</label>
                <select 
                  className="w-full text-sm border rounded h-9 px-3 focus:ring-1 focus:ring-blue-500 outline-none"
                  value={element.properties.fontWeight || 400}
                  onChange={e => handlePropChange("fontWeight", Number(e.target.value))}
                >
                  <option value="400">Normal</option>
                  <option value="500">Medium</option>
                  <option value="600">Semi Bold</option>
                  <option value="700">Bold</option>
                  <option value="800">Extra Bold</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Line Height</label>
                <Input 
                  type="number"
                  step="0.1"
                  value={element.properties.lineHeight || 1.2}
                  onChange={e => handlePropChange("lineHeight", Number(e.target.value))}
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Letter Spacing</label>
                <Input 
                  type="number"
                  step="0.5"
                  value={element.properties.letterSpacing || 0}
                  onChange={e => handlePropChange("letterSpacing", Number(e.target.value))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Alignment</label>
                <select 
                  className="w-full text-sm border rounded h-9 px-3 focus:ring-1 focus:ring-blue-500 outline-none"
                  value={element.properties.alignment || "left"}
                  onChange={e => handlePropChange("alignment", e.target.value)}
                >
                  <option value="left">Left</option>
                  <option value="center">Center</option>
                  <option value="right">Right</option>
                  <option value="justify">Justify</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Color</label>
                <div className="flex h-9 items-center border rounded px-1 overflow-hidden">
                  <input 
                    type="color"
                    className="w-6 h-6 border-0 p-0 cursor-pointer bg-transparent"
                    value={element.properties.color}
                    onChange={e => handlePropChange("color", e.target.value)}
                  />
                  <Input 
                    type="text"
                    className="border-0 focus-visible:ring-0 px-2 text-xs"
                    value={element.properties.color}
                    onChange={e => handlePropChange("color", e.target.value)}
                  />
                </div>
              </div>
            </div>
          </>
        )}

        {element.type === "shape" && (
          <>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Fill</label>
              <Input 
                type="color"
                value={element.properties.fill}
                onChange={e => handlePropChange("fill", e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Border Color</label>
              <Input 
                type="color"
                value={element.properties.borderColor || "#000000"}
                onChange={e => handlePropChange("borderColor", e.target.value)}
              />
            </div>
          </>
        )}

        {element.type === "chart" && (
          <>
             <div>
              <label className="text-xs text-gray-500 mb-1 block">Chart Title</label>
              <Input 
                value={element.properties.title || ""}
                onChange={e => handlePropChange("title", e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Chart Type</label>
                <select 
                  className="w-full text-sm border rounded h-9 px-2 focus:ring-1 focus:ring-blue-500 outline-none"
                  value={element.properties.chartType}
                  onChange={e => handlePropChange("chartType", e.target.value)}
                >
                  <option value="bar">Bar</option>
                  <option value="line">Line</option>
                  <option value="area">Area</option>
                  <option value="pie">Pie</option>
                  <option value="doughnut">Doughnut</option>
                </select>
              </div>
              <div className="flex flex-col gap-1 justify-end pb-1">
                <label className="flex items-center text-xs text-gray-600 gap-2 cursor-pointer">
                  <input type="checkbox" checked={element.properties.showLegend !== false} onChange={e => handlePropChange("showLegend", e.target.checked)} />
                  Show Legend
                </label>
                <label className="flex items-center text-xs text-gray-600 gap-2 cursor-pointer">
                  <input type="checkbox" checked={element.properties.showAxes !== false} onChange={e => handlePropChange("showAxes", e.target.checked)} />
                  Show Axes
                </label>
              </div>
            </div>
            
            <ChartDataEditor element={element} onChange={handlePropChange} />
          </>
        )}
      </div>

      <div className="mt-8 border-t pt-4">
        <h4 className="text-xs text-gray-500 mb-2 font-semibold">Transform</h4>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-gray-400 block mb-1">Width</label>
            <Input type="number" value={Math.round(element.width)} onChange={e => updateElement(activeSlideId, element.id, { width: Number(e.target.value) })} />
          </div>
          <div>
            <label className="text-xs text-gray-400 block mb-1">Height</label>
            <Input type="number" value={Math.round(element.height)} onChange={e => updateElement(activeSlideId, element.id, { height: Number(e.target.value) })} />
          </div>
        </div>
      </div>
    </div>
  );
}

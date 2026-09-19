import React from "react";
import { TextElement, ChartElement, TableElement, ShapeElement, ImageElement, PresentationElement } from "../types";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell } from "recharts";

export function TextRenderer({ element }: { element: TextElement }) {
  const { content, fontSize, fontWeight, color, alignment, lineHeight, letterSpacing } = element.properties;
  
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        fontSize: `${fontSize}px`,
        fontWeight,
        color,
        textAlign: alignment,
        lineHeight,
        letterSpacing: `${letterSpacing}px`,
        whiteSpace: "pre-wrap",
        wordBreak: "break-word",
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-start",
      }}
    >
      {content}
    </div>
  );
}

export function ImageRenderer({ element }: { element: ImageElement & { properties: { url?: string } } }) {
  const { src, url, alt, objectFit, opacity, borderRadius } = element.properties;
  const imageSrc = src || url;
  
  return (
    <div style={{ width: "100%", height: "100%", overflow: "hidden", borderRadius: `${borderRadius}px`, opacity }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imageSrc}
        alt={alt || ""}
        style={{ width: "100%", height: "100%", objectFit }}
        draggable={false}
      />
    </div>
  );
}

export function ShapeRenderer({ element }: { element: ShapeElement }) {
  const { shapeType, fill, borderColor, borderWidth, borderRadius, opacity } = element.properties;
  
  const baseStyle: React.CSSProperties = {
    width: "100%",
    height: "100%",
    backgroundColor: fill,
    border: borderWidth ? `${borderWidth}px solid ${borderColor}` : "none",
    opacity,
  };

  if (shapeType === "circle") {
    baseStyle.borderRadius = "50%";
  } else if (shapeType === "rounded-rectangle") {
    baseStyle.borderRadius = `${borderRadius || 16}px`;
  }

  return <div style={baseStyle} />;
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"];

export function ChartRenderer({ element }: { element: ChartElement }) {
  const { chartType, labels, datasets, showLegend, showAxes, title } = element.properties;
  
  // Transform data for recharts
  const data = labels.map((label, index) => {
    const dataPoint: any = { name: label };
    datasets.forEach((ds) => {
      dataPoint[ds.label] = ds.values[index] || 0;
    });
    return dataPoint;
  });

  return (
    <div className="w-full h-full flex flex-col">
      {title && <h3 className="text-center font-semibold mb-2">{title}</h3>}
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === "bar" ? (
            <BarChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              {showAxes && <CartesianGrid strokeDasharray="3 3" vertical={false} />}
              {showAxes && <XAxis dataKey="name" />}
              {showAxes && <YAxis />}
              <Tooltip cursor={{ fill: 'rgba(0,0,0,0.05)' }} />
              {showLegend && <Legend />}
              {datasets.map((ds, i) => (
                <Bar key={ds.label} dataKey={ds.label} fill={ds.color || COLORS[i % COLORS.length]} radius={[4, 4, 0, 0]} />
              ))}
            </BarChart>
          ) : chartType === "line" ? (
            <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              {showAxes && <CartesianGrid strokeDasharray="3 3" vertical={false} />}
              {showAxes && <XAxis dataKey="name" />}
              {showAxes && <YAxis />}
              <Tooltip />
              {showLegend && <Legend />}
              {datasets.map((ds, i) => (
                <Line key={ds.label} type="monotone" dataKey={ds.label} stroke={ds.color || COLORS[i % COLORS.length]} strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              ))}
            </LineChart>
          ) : chartType === "area" ? (
            <AreaChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              {showAxes && <CartesianGrid strokeDasharray="3 3" vertical={false} />}
              {showAxes && <XAxis dataKey="name" />}
              {showAxes && <YAxis />}
              <Tooltip />
              {showLegend && <Legend />}
              {datasets.map((ds, i) => (
                <Area key={ds.label} type="monotone" dataKey={ds.label} fill={ds.color || COLORS[i % COLORS.length]} stroke={ds.color || COLORS[i % COLORS.length]} fillOpacity={0.3} strokeWidth={2} />
              ))}
            </AreaChart>
          ) : (
            <PieChart>
              <Tooltip />
              {showLegend && <Legend />}
              <Pie
                data={data}
                dataKey={datasets[0]?.label || "value"}
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={chartType === "doughnut" ? "60%" : 0}
                outerRadius="80%"
                fill="#8884d8"
              >
                {data.map((_, i) => (
                  <Cell key={`cell-${i}`} fill={datasets[0]?.color || COLORS[i % COLORS.length]} />
                ))}
              </Pie>
            </PieChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function TableRenderer({ element }: { element: TableElement }) {
  const { columns, rows, data, headerColor, borderColor } = element.properties;
  
  return (
    <div className="w-full h-full overflow-hidden">
      <table className="w-full border-collapse h-full" style={{ border: borderColor ? `1px solid ${borderColor}` : "none" }}>
        <tbody>
          {data.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.map((cell, colIndex) => (
                <td
                  key={colIndex}
                  style={{
                    backgroundColor: cell.isHeader ? headerColor || "#f1f5f9" : "transparent",
                    border: borderColor ? `1px solid ${borderColor}` : "1px solid #e2e8f0",
                    padding: "8px 12px",
                    textAlign: cell.align || "left",
                    fontWeight: cell.isHeader ? 600 : 400,
                    width: `${100 / columns}%`,
                  }}
                >
                  {cell.value}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ElementRenderer({ element }: { element: PresentationElement }) {
  switch (element.type) {
    case "text": return <TextRenderer element={element} />;
    case "image": return <ImageRenderer element={element} />;
    case "shape": return <ShapeRenderer element={element} />;
    case "chart": return <ChartRenderer element={element} />;
    case "table": return <TableRenderer element={element} />;
    default: return <div>Unknown element type</div>;
  }
}

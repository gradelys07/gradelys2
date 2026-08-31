"use client";

import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

const COLORS = ["#0EA5E9", "#10B981", "#F59E0B", "#8B5CF6", "#EF4444", "#334155"];

export function ChartRenderer({ data }: { data: { chartType: "bar" | "line" | "pie"; data: { name: string; value: number }[] } }) {
  const items = data.data || [];

  if (data.chartType === "pie") {
    return (
      <ResponsiveContainer width="100%" height={320}>
        <PieChart>
          <Pie data={items} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={110} label>
            {items.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip contentStyle={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 8, fontSize: 13, color: "#334155" }} />
        </PieChart>
      </ResponsiveContainer>
    );
  }

  if (data.chartType === "line") {
    return (
      <ResponsiveContainer width="100%" height={320}>
        <LineChart data={items}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
          <XAxis dataKey="name" stroke="#94A3B8" fontSize={12} />
          <YAxis stroke="#94A3B8" fontSize={12} />
          <Tooltip contentStyle={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 8, fontSize: 13, color: "#334155" }} />
          <Line type="monotone" dataKey="value" stroke="#0EA5E9" strokeWidth={2} dot={{ fill: "#0EA5E9" }} />
        </LineChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart data={items}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
        <XAxis dataKey="name" stroke="#94A3B8" fontSize={12} />
        <YAxis stroke="#94A3B8" fontSize={12} />
        <Tooltip contentStyle={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 8, fontSize: 13, color: "#334155" }} />
        <Bar dataKey="value" fill="#0EA5E9" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

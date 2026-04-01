import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Receipt,
  Plus,
} from "lucide-react";
import { expenseApi } from "../services/api";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import toast from "react-hot-toast";

const COLORS = [
  "#6366f1",
  "#8b5cf6",
  "#ec4899",
  "#f59e0b",
  "#10b981",
  "#3b82f6",
  "#ef4444",
  "#14b8a6",
];

const CategoryColors = {
  Food: "#f59e0b",
  Travel: "#3b82f6",
  Bills: "#ef4444",
  Shopping: "#ec4899",
  Healthcare: "#10b981",
  Entertainment: "#8b5cf6",
  Education: "#6366f1",
  Transport: "#14b8a6",
  Housing: "#f97316",
  Other: "#6b7280",
};

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    expenseApi
      .getDashboard()
      .then((r) => setData(r.data))
      .catch(() => toast.error("Failed to load dashboard"))
      .finally(() => setLoading(false));
  }, []);

  if (loading)
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full" />
      </div>
    );

  const change =
    data?.totalLastMonth > 0
      ? (
          ((data.totalThisMonth - data.totalLastMonth) / data.totalLastMonth) *
          100
        ).toFixed(1)
      : null;

  const stats = [
    {
      label: "This Month",
      value: `₹${data?.totalThisMonth?.toLocaleString("en-IN", { minimumFractionDigits: 0 }) ?? 0}`,
      sub: change
        ? `${change > 0 ? "+" : ""}${change}% vs last month`
        : "No previous data",
      icon: DollarSign,
      color: "indigo",
      positive: change <= 0,
    },
    {
      label: "Last Month",
      value: `₹${data?.totalLastMonth?.toLocaleString("en-IN") ?? 0}`,
      sub: "Previous month total",
      icon: TrendingDown,
      color: "indigo",
      positive: true,
    },
    {
      label: "All Time",
      value: `₹${data?.totalAllTime?.toLocaleString("en-IN") ?? 0}`,
      sub: "Lifetime total",
      icon: TrendingUp,
      color: "indigo",
      positive: true,
    },
    {
      label: "Transactions",
      value: data?.expenseCountThisMonth ?? 0,
      sub: "This month",
      icon: Receipt,
      color: "indigo",
      positive: true,
    },
  ];

  return (
    <div className="p-8 space-y-8 min-h-full bg-gray-950">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-gray-400 text-sm mt-0.5">
            Your financial overview
          </p>
        </div>
        <Link
          to="/expenses"
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-xl transition shadow-lg shadow-indigo-600/30"
        >
          <Plus className="w-4 h-4" /> Add Expense
        </Link>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map(({ label, value, sub, icon: Icon, color }) => (
          <div
            key={label}
            className="bg-gray-900 border border-gray-800 rounded-2xl p-5"
          >
            <div className="flex items-start justify-between mb-4">
              <div
                className={`w-10 h-10 rounded-xl bg-${color}-500/20 flex items-center justify-center`}
              >
                <Icon className={`w-5 h-5 text-${color}-400`} />
              </div>
            </div>
            <p className="text-2xl font-bold text-white">{value}</p>
            <p className="text-gray-400 text-sm mt-0.5">{label}</p>
            <p className="text-xs text-gray-600 mt-1">{sub}</p>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Monthly Bar Chart */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <h2 className="text-white font-semibold mb-5">Monthly Trend</h2>
          {data?.monthlyTrend?.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={data.monthlyTrend} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis
                  dataKey="month"
                  tick={{ fill: "#9ca3af", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "#9ca3af", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) =>
                    `₹${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`
                  }
                />
                <Tooltip
                  contentStyle={{
                    background: "#111827",
                    border: "1px solid #374151",
                    borderRadius: 12,
                    color: "#f9fafb",
                  }}
                  formatter={(v) => [`₹${v.toLocaleString("en-IN")}`, "Amount"]}
                />
                <Bar dataKey="amount" fill="#6366f1" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-gray-600">
              No data yet
            </div>
          )}
        </div>

        {/* Category Pie */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <h2 className="text-white font-semibold mb-5">
            This Month by Category
          </h2>
          {data?.categoryBreakdown?.length > 0 ? (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width="50%" height={180}>
                <PieChart>
                  <Pie
                    data={data.categoryBreakdown}
                    dataKey="amount"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                  >
                    {data.categoryBreakdown.map((entry, i) => (
                      <Cell
                        key={i}
                        fill={
                          CategoryColors[entry.category] ||
                          COLORS[i % COLORS.length]
                        }
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "#111827",
                      border: "1px solid #374151",
                      borderRadius: 12,
                    }}
                    itemStyle={{ color: "#f9fafb" }}
                    labelStyle={{ color: "#9ca3af" }}
                    formatter={(v) => [
                      `₹${v.toLocaleString("en-IN")}`,
                      "Amount",
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2">
                {data.categoryBreakdown.slice(0, 5).map((cat, i) => (
                  <div
                    key={cat.category}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2.5 h-2.5 rounded-full"
                        style={{
                          background:
                            CategoryColors[cat.category] ||
                            COLORS[i % COLORS.length],
                        }}
                      />
                      <span className="text-gray-300 text-xs">
                        {cat.category}
                      </span>
                    </div>
                    <span className="text-white text-xs font-mono">
                      ₹{cat.amount.toLocaleString("en-IN")}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-gray-600">
              No expenses this month
            </div>
          )}
        </div>
      </div>

      {/* Recent Expenses */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-white font-semibold">Recent Expenses</h2>
          <Link
            to="/expenses"
            className="text-indigo-400 hover:text-indigo-300 text-sm"
          >
            View all →
          </Link>
        </div>
        {data?.recentExpenses?.length > 0 ? (
          <div className="space-y-3">
            {data.recentExpenses.map((exp) => (
              <div
                key={exp.id}
                className="flex items-center justify-between py-3 border-b border-gray-800 last:border-0"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-sm"
                    style={{
                      background: `${CategoryColors[exp.category]}20`,
                      color: CategoryColors[exp.category],
                    }}
                  >
                    {exp.category[0]}
                  </div>
                  <div>
                    <p className="text-white text-sm font-medium">
                      {exp.title}
                    </p>
                    <p className="text-gray-500 text-xs">
                      {exp.category} •{" "}
                      {new Date(exp.date).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                      })}
                    </p>
                  </div>
                </div>
                <span className="text-white font-semibold font-mono">
                  ₹{exp.amount.toLocaleString("en-IN")}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center text-gray-600">
            <Receipt className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p>
              No expenses yet.{" "}
              <Link to="/expenses" className="text-indigo-400">
                Add your first one!
              </Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

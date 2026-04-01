import { useEffect, useState, useCallback } from "react";
import {
  Plus,
  Search,
  Filter,
  Download,
  Pencil,
  Trash2,
  X,
} from "lucide-react";
import { expenseApi } from "../services/api";
import toast from "react-hot-toast";
import { format } from "date-fns";

const CATEGORIES = [
  "Food",
  "Travel",
  "Bills",
  "Shopping",
  "Healthcare",
  "Entertainment",
  "Education",
  "Transport",
  "Housing",
  "Other",
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

const EMPTY_FORM = {
  title: "",
  amount: "",
  category: "Food",
  date: format(new Date(), "yyyy-MM-dd"),
  notes: "",
};

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState([]);
  const [meta, setMeta] = useState({ totalCount: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [filters, setFilters] = useState({ category: "", search: "", page: 1 });
  const [exporting, setExporting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page: filters.page, pageSize: 15 };
      if (filters.category) params.category = filters.category;
      const { data } = await expenseApi.getAll(params);
      setExpenses(data.items);
      setMeta({ totalCount: data.totalCount, totalPages: data.totalPages });
    } catch {
      toast.error("Failed to load expenses");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  const openAdd = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  };
  const openEdit = (exp) => {
    setEditing(exp);
    setForm({
      title: exp.title,
      amount: exp.amount.toString(),
      category: exp.category,
      date: format(new Date(exp.date), "yyyy-MM-dd"),
      notes: exp.notes || "",
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.amount)
      return toast.error("Fill all required fields");
    setSubmitting(true);
    const payload = {
      ...form,
      amount: parseFloat(form.amount),
      date: new Date(form.date).toISOString(),
    };
    try {
      if (editing) {
        await expenseApi.update(editing.id, payload);
        toast.success("Expense updated!");
      } else {
        await expenseApi.create(payload);
        toast.success("Expense added!");
      }
      setShowModal(false);
      fetchExpenses();
    } catch (err) {
      toast.error(err.response?.data?.message || "Operation failed");
    } finally {
      setSubmitting(false);
    }
  };

 const handleDelete = (id) => {
   setConfirmDelete(id);
 };

 const confirmDeleteAction = async () => {
   if (!confirmDelete) return;

   setDeleting(confirmDelete);
   try {
     await expenseApi.delete(confirmDelete);
     toast.success("Deleted");
     fetchExpenses();
   } catch {
     toast.error("Delete failed");
   } finally {
     setDeleting(null);
     setConfirmDelete(null);
   }
 };

  const handleExport = async () => {
    setExporting(true);
    try {
      const { data } = await expenseApi.exportPdf();
      const url = URL.createObjectURL(
        new Blob([data], { type: "application/pdf" }),
      );
      const a = document.createElement("a");
      a.href = url;
      a.download = `expenses_${format(new Date(), "yyyyMMdd")}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("PDF exported!");
    } catch {
      toast.error("Export failed");
    } finally {
      setExporting(false);
    }
  };

  const filteredExpenses = expenses.filter(
    (e) =>
      !filters.search ||
      e.title.toLowerCase().includes(filters.search.toLowerCase()),
  );

  return (
    <div className="p-8 min-h-full bg-gray-950">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Expenses</h1>
          <p className="text-gray-400 text-sm mt-0.5">
            {meta.totalCount} total records
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleExport}
            disabled={exporting}
            className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 text-sm font-medium rounded-xl transition"
          >
            <Download className="w-4 h-4" />
            {exporting ? "Exporting..." : "Export PDF"}
          </button>
          <button
            onClick={openAdd}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-xl transition shadow-lg shadow-indigo-600/30"
          >
            <Plus className="w-4 h-4" /> Add Expense
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative flex-1 min-w-60">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            value={filters.search}
            onChange={(e) =>
              setFilters((p) => ({ ...p, search: e.target.value }))
            }
            placeholder="Search expenses..."
            className="w-full pl-10 pr-4 py-2.5 bg-gray-900 border border-gray-800 rounded-xl text-gray-200 placeholder-gray-600 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
          />
        </div>
        <select
          value={filters.category}
          onChange={(e) =>
            setFilters((p) => ({ ...p, category: e.target.value, page: 1 }))
          }
          className="px-4 py-2.5 bg-gray-900 border border-gray-800 rounded-xl text-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
        >
          <option value="">All Categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        {filters.category && (
          <button
            onClick={() => setFilters((p) => ({ ...p, category: "", page: 1 }))}
            className="flex items-center gap-1 px-3 py-2.5 bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 rounded-xl text-sm hover:bg-indigo-600/30 transition"
          >
            <X className="w-3 h-3" /> Clear
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="py-20 flex items-center justify-center">
            <div className="animate-spin w-7 h-7 border-2 border-indigo-500 border-t-transparent rounded-full" />
          </div>
        ) : filteredExpenses.length === 0 ? (
          <div className="py-20 text-center text-gray-500">
            <Filter className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>No expenses found</p>
          </div>
        ) : (
          <>
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800 bg-gray-900/80">
                  {[
                    "Title",
                    "Amount",
                    "Category",
                    "Date",
                    "Notes",
                    "Actions",
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60">
                {filteredExpenses.map((exp) => (
                  <tr
                    key={exp.id}
                    className="hover:bg-gray-800/40 transition-colors group"
                  >
                    <td className="px-5 py-4">
                      <span className="text-white text-sm font-medium">
                        {exp.title}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-white font-semibold font-mono text-sm">
                        ₹
                        {exp.amount.toLocaleString("en-IN", {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium"
                        style={{
                          background: `${CategoryColors[exp.category]}20`,
                          color: CategoryColors[exp.category],
                        }}
                      >
                        {exp.category}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-gray-400 text-sm">
                      {format(new Date(exp.date), "dd MMM yyyy")}
                    </td>
                    <td className="px-5 py-4 text-gray-500 text-sm max-w-[200px] truncate">
                      {exp.notes || "—"}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => openEdit(exp)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-400 hover:bg-indigo-400/10 transition"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(exp.id)}
                          disabled={deleting === exp.id}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-400/10 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            {meta.totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-4 border-t border-gray-800">
                <span className="text-gray-500 text-sm">
                  Page {filters.page} of {meta.totalPages}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      setFilters((p) => ({ ...p, page: p.page - 1 }))
                    }
                    disabled={filters.page <= 1}
                    className="px-3 py-1.5 bg-gray-800 text-gray-300 text-sm rounded-lg disabled:opacity-40 hover:bg-gray-700 transition"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() =>
                      setFilters((p) => ({ ...p, page: p.page + 1 }))
                    }
                    disabled={filters.page >= meta.totalPages}
                    className="px-3 py-1.5 bg-gray-800 text-gray-300 text-sm rounded-lg disabled:opacity-40 hover:bg-gray-700 transition"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={(e) => e.target === e.currentTarget && setShowModal(false)}
        >
          <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-800">
              <h2 className="text-white font-semibold">
                {editing ? "Edit Expense" : "Add Expense"}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">
                  Title *
                </label>
                <input
                  required
                  value={form.title}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, title: e.target.value }))
                  }
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                  placeholder="e.g. Lunch at café"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1.5">
                    Amount (₹) *
                  </label>
                  <input
                    required
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={form.amount}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, amount: e.target.value }))
                    }
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1.5">
                    Date *
                  </label>
                  <input
                    required
                    type="date"
                    value={form.date}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, date: e.target.value }))
                    }
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">
                  Category *
                </label>
                <select
                  value={form.category}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, category: e.target.value }))
                  }
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1.5">
                  Notes
                </label>
                <textarea
                  value={form.notes}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, notes: e.target.value }))
                  }
                  rows={2}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition resize-none"
                  placeholder="Optional notes..."
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-medium rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition shadow-lg shadow-indigo-600/30"
                >
                  {submitting
                    ? "Saving..."
                    : editing
                      ? "Update"
                      : "Add Expense"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-sm shadow-2xl">
            <div className="px-6 py-5 border-b border-gray-800">
              <h2 className="text-white font-semibold">Delete Expense</h2>
            </div>

            <div className="p-6">
              <p className="text-gray-400 text-sm">
                Are you sure you want to delete this expense?
              </p>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setConfirmDelete(null)}
                  className="flex-1 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm rounded-xl transition"
                >
                  Cancel
                </button>

                <button
                  onClick={confirmDeleteAction}
                  className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 text-white text-sm font-semibold rounded-xl transition"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

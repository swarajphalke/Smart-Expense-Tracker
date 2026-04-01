using backend.Data;
using backend.DTOs;
using backend.Models;
using Microsoft.EntityFrameworkCore;

namespace backend.Repositories;

public interface IExpenseRepository
{
    Task<PagedResult<Expense>> GetByUserAsync(int userId, ExpenseFilterDto filter);
    Task<Expense?> GetByIdAsync(int id, int userId);
    Task<Expense> CreateAsync(Expense expense);
    Task<Expense> UpdateAsync(Expense expense);
    Task<bool> DeleteAsync(int id, int userId);
    Task<List<Expense>> GetAllByUserAsync(int userId, DateTime? start = null, DateTime? end = null);
    Task<DashboardDto> GetDashboardDataAsync(int userId);
}

public class ExpenseRepository : IExpenseRepository
{
    private readonly AppDbContext _db;

    public ExpenseRepository(AppDbContext db) => _db = db;

    public async Task<PagedResult<Expense>> GetByUserAsync(int userId, ExpenseFilterDto filter)
    {
        var query = _db.Expenses.Where(e => e.UserId == userId);

        if (!string.IsNullOrEmpty(filter.Category))
            query = query.Where(e => e.Category == filter.Category);

        if (filter.StartDate.HasValue)
            query = query.Where(e => e.Date >= filter.StartDate.Value);

        if (filter.EndDate.HasValue)
            query = query.Where(e => e.Date <= filter.EndDate.Value);

        query = (filter.SortBy?.ToLower(), filter.SortOrder?.ToLower()) switch
        {
            ("amount", "asc") => query.OrderBy(e => e.Amount),
            ("amount", _) => query.OrderByDescending(e => e.Amount),
            ("title", "asc") => query.OrderBy(e => e.Title),
            ("title", _) => query.OrderByDescending(e => e.Title),
            ("category", "asc") => query.OrderBy(e => e.Category),
            ("category", _) => query.OrderByDescending(e => e.Category),
            (_, "asc") => query.OrderBy(e => e.Date),
            _ => query.OrderByDescending(e => e.Date)
        };

        var total = await query.CountAsync();
        var items = await query.Skip((filter.Page - 1) * filter.PageSize).Take(filter.PageSize).ToListAsync();

        return new PagedResult<Expense>(items, total, filter.Page, filter.PageSize,
            (int)Math.Ceiling((double)total / filter.PageSize));
    }

    public async Task<Expense?> GetByIdAsync(int id, int userId) =>
        await _db.Expenses.FirstOrDefaultAsync(e => e.Id == id && e.UserId == userId);

    public async Task<Expense> CreateAsync(Expense expense)
    {
        _db.Expenses.Add(expense);
        await _db.SaveChangesAsync();
        return expense;
    }

    public async Task<Expense> UpdateAsync(Expense expense)
    {
        expense.UpdatedAt = DateTime.UtcNow;
        _db.Expenses.Update(expense);
        await _db.SaveChangesAsync();
        return expense;
    }

    public async Task<bool> DeleteAsync(int id, int userId)
    {
        var expense = await GetByIdAsync(id, userId);
        if (expense == null) return false;
        _db.Expenses.Remove(expense);
        await _db.SaveChangesAsync();
        return true;
    }

    public async Task<List<Expense>> GetAllByUserAsync(int userId, DateTime? start = null, DateTime? end = null)
    {
        var query = _db.Expenses.Where(e => e.UserId == userId);
        if (start.HasValue) query = query.Where(e => e.Date >= start.Value);
        if (end.HasValue) query = query.Where(e => e.Date <= end.Value);
        return await query.OrderByDescending(e => e.Date).ToListAsync();
    }

    public async Task<DashboardDto> GetDashboardDataAsync(int userId)
    {
        var now = DateTime.UtcNow;
        var thisMonthStart = new DateTime(now.Year, now.Month, 1);
        var lastMonthStart = thisMonthStart.AddMonths(-1);

        var allExpenses = await _db.Expenses.Where(e => e.UserId == userId).ToListAsync();

        var thisMonth = allExpenses.Where(e => e.Date >= thisMonthStart).ToList();
        var lastMonth = allExpenses.Where(e => e.Date >= lastMonthStart && e.Date < thisMonthStart).ToList();

        var categoryBreakdown = thisMonth
            .GroupBy(e => e.Category)
            .Select(g => new CategorySummaryDto(g.Key, g.Sum(e => e.Amount), g.Count()))
            .OrderByDescending(c => c.Amount)
            .ToList();

        var monthlyTrend = allExpenses
            .GroupBy(e => new { e.Date.Year, e.Date.Month })
            .Select(g => new MonthlySummaryDto(
                new DateTime(g.Key.Year, g.Key.Month, 1).ToString("MMM"),
                g.Key.Year,
                g.Sum(e => e.Amount)))
            .OrderBy(m => m.Year).ThenBy(m => m.Month)
            .TakeLast(6)
            .ToList();

        var recentExpenses = allExpenses
            .OrderByDescending(e => e.Date)
            .Take(5)
            .Select(e => new ExpenseDto(e.Id, e.Title, e.Amount, e.Category, e.Date, e.Notes, e.CreatedAt, e.UpdatedAt))
            .ToList();

        return new DashboardDto(
            thisMonth.Sum(e => e.Amount),
            lastMonth.Sum(e => e.Amount),
            allExpenses.Sum(e => e.Amount),
            thisMonth.Count,
            categoryBreakdown,
            monthlyTrend,
            recentExpenses
        );
    }
}
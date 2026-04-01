using AutoMapper;
using backend.DTOs;
using backend.Models;
using backend.Repositories;


namespace backend.Services;

public interface IExpenseService
{
    Task<PagedResult<ExpenseDto>> GetExpensesAsync(int userId, ExpenseFilterDto filter);
    Task<ExpenseDto?> GetExpenseAsync(int id, int userId);
    Task<(bool Success, string Message, ExpenseDto? Expense)> CreateExpenseAsync(int userId, CreateExpenseDto dto);
    Task<(bool Success, string Message, ExpenseDto? Expense)> UpdateExpenseAsync(int id, int userId, UpdateExpenseDto dto);
    Task<(bool Success, string Message)> DeleteExpenseAsync(int id, int userId);
    Task<DashboardDto> GetDashboardAsync(int userId);
    Task<List<ExpenseDto>> GetAllForExportAsync(int userId, DateTime? start, DateTime? end);
}

public class ExpenseService : IExpenseService
{
    private readonly IExpenseRepository _repo;
    private readonly IMapper _mapper;

    public static readonly List<string> ValidCategories = new()
    {
        "Food", "Travel", "Bills", "Shopping", "Healthcare",
        "Entertainment", "Education", "Transport", "Housing", "Other"
    };

    public ExpenseService(IExpenseRepository repo, IMapper mapper)
    {
        _repo = repo;
        _mapper = mapper;
    }

    public async Task<PagedResult<ExpenseDto>> GetExpensesAsync(int userId, ExpenseFilterDto filter)
    {
        var result = await _repo.GetByUserAsync(userId, filter);
        var dtos = _mapper.Map<List<ExpenseDto>>(result.Items);
        return new PagedResult<ExpenseDto>(dtos, result.TotalCount, result.Page, result.PageSize, result.TotalPages);
    }

    public async Task<ExpenseDto?> GetExpenseAsync(int id, int userId)
    {
        var expense = await _repo.GetByIdAsync(id, userId);
        return expense == null ? null : _mapper.Map<ExpenseDto>(expense);
    }

    public async Task<(bool, string, ExpenseDto?)> CreateExpenseAsync(int userId, CreateExpenseDto dto)
    {
        var (valid, msg) = Validate(dto.Title, dto.Amount, dto.Category);
        if (!valid) return (false, msg, null);

        var expense = _mapper.Map<Expense>(dto);
        expense.UserId = userId;

        var created = await _repo.CreateAsync(expense);
        return (true, "Expense created.", _mapper.Map<ExpenseDto>(created));
    }

    public async Task<(bool, string, ExpenseDto?)> UpdateExpenseAsync(int id, int userId, UpdateExpenseDto dto)
    {
        var expense = await _repo.GetByIdAsync(id, userId);
        if (expense == null) return (false, "Expense not found.", null);

        var (valid, msg) = Validate(dto.Title, dto.Amount, dto.Category);
        if (!valid) return (false, msg, null);

        _mapper.Map(dto, expense);
        var updated = await _repo.UpdateAsync(expense);
        return (true, "Expense updated.", _mapper.Map<ExpenseDto>(updated));
    }

    public async Task<(bool, string)> DeleteExpenseAsync(int id, int userId)
    {
        var deleted = await _repo.DeleteAsync(id, userId);
        return deleted ? (true, "Expense deleted.") : (false, "Expense not found.");
    }

    public async Task<DashboardDto> GetDashboardAsync(int userId) =>
        await _repo.GetDashboardDataAsync(userId);

    public async Task<List<ExpenseDto>> GetAllForExportAsync(int userId, DateTime? start, DateTime? end)
    {
        var expenses = await _repo.GetAllByUserAsync(userId, start, end);
        return _mapper.Map<List<ExpenseDto>>(expenses);
    }

    private static (bool Valid, string Message) Validate(string title, decimal amount, string category)
    {
        if (string.IsNullOrWhiteSpace(title) || title.Length < 2)
            return (false, "Title must be at least 2 characters.");
        if (amount <= 0)
            return (false, "Amount must be greater than zero.");
        if (!ValidCategories.Contains(category))
            return (false, $"Invalid category. Valid: {string.Join(", ", ValidCategories)}");
        return (true, string.Empty);
    }
}
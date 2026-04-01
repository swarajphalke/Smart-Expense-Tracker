using System.Text.Json.Serialization;
namespace backend.DTOs;

// Auth DTOs
public record RegisterDto([property: JsonPropertyName("name")] string Name,
    [property: JsonPropertyName("email")] string Email,
    [property: JsonPropertyName("password")] string Password);
public record LoginDto(string Email, string Password);
public record AuthResponseDto(string Token, UserDto User);

public record UserDto(int Id, string Name, string Email, DateTime CreatedAt);

// Expense DTOs
public record CreateExpenseDto(
    string Title,
    decimal Amount,
    string Category,
    DateTime Date,
    string? Notes
);

public record UpdateExpenseDto(
    string Title,
    decimal Amount,
    string Category,
    DateTime Date,
    string? Notes
);

public record ExpenseDto(
    int Id,
    string Title,
    decimal Amount,
    string Category,
    DateTime Date,
    string? Notes,
    DateTime CreatedAt,
    DateTime UpdatedAt
);

// Dashboard DTOs
public record DashboardDto(
    decimal TotalThisMonth,
    decimal TotalLastMonth,
    decimal TotalAllTime,
    int ExpenseCountThisMonth,
    List<CategorySummaryDto> CategoryBreakdown,
    List<MonthlySummaryDto> MonthlyTrend,
    List<ExpenseDto> RecentExpenses
);

public record CategorySummaryDto(string Category, decimal Amount, int Count);
public record MonthlySummaryDto(string Month, int Year, decimal Amount);

// Query/Filter DTOs
public record ExpenseFilterDto(
    string? Category = null,
    DateTime? StartDate = null,
    DateTime? EndDate = null,
    string? SortBy = "Date",
    string? SortOrder = "desc",
    int Page = 1,
    int PageSize = 20
);

public record PagedResult<T>(List<T> Items, int TotalCount, int Page, int PageSize, int TotalPages);
using backend.DTOs;
using backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ExpensesController : ControllerBase
{
    private readonly IExpenseService _expenseService;
    private readonly IPdfService _pdfService;

    public ExpensesController(IExpenseService expenseService, IPdfService pdfService)
    {
        _expenseService = expenseService;
        _pdfService = pdfService;
    }

    private int UserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
    private string UserName => User.FindFirstValue(ClaimTypes.Name) ?? "User";

    [HttpGet]
    public async Task<IActionResult> GetExpenses([FromQuery] ExpenseFilterDto filter)
    {
        var result = await _expenseService.GetExpensesAsync(UserId, filter);
        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetExpense(int id)
    {
        var expense = await _expenseService.GetExpenseAsync(id, UserId);
        if (expense == null) return NotFound(new { message = "Expense not found." });
        return Ok(expense);
    }

    [HttpPost]
    public async Task<IActionResult> CreateExpense([FromBody] CreateExpenseDto dto)
    {
        var (success, message, expense) = await _expenseService.CreateExpenseAsync(UserId, dto);
        if (!success) return BadRequest(new { message });
        return CreatedAtAction(nameof(GetExpense), new { id = expense!.Id }, expense);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateExpense(int id, [FromBody] UpdateExpenseDto dto)
    {
        var (success, message, expense) = await _expenseService.UpdateExpenseAsync(id, UserId, dto);
        if (!success) return BadRequest(new { message });
        return Ok(expense);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteExpense(int id)
    {
        var (success, message) = await _expenseService.DeleteExpenseAsync(id, UserId);
        if (!success) return NotFound(new { message });
        return Ok(new { message });
    }

    [HttpGet("dashboard")]
    public async Task<IActionResult> GetDashboard()
    {
        var data = await _expenseService.GetDashboardAsync(UserId);
        return Ok(data);
    }

    [HttpGet("categories")]
    public IActionResult GetCategories() => Ok(ExpenseService.ValidCategories);

    [HttpGet("export/pdf")]
    public async Task<IActionResult> ExportPdf([FromQuery] DateTime? startDate, [FromQuery] DateTime? endDate)
    {
        var expenses = await _expenseService.GetAllForExportAsync(UserId, startDate, endDate);
        var pdf = _pdfService.GenerateExpenseReport(expenses, UserName, startDate, endDate);
        return File(pdf, "application/pdf", $"expenses_{DateTime.Now:yyyyMMdd}.pdf");
    }
}
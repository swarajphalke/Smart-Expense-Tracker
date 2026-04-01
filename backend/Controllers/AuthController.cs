using backend.DTOs;
using backend.Services;

using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService) => _authService = authService;

    /// <summary>Register a new user</summary>
    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterDto dto)
    {
        var (success, message, response) = await _authService.RegisterAsync(dto);
        if (!success) return BadRequest(new { message });
        return Ok(response);
    }

    /// <summary>Login and get JWT token</summary>
    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginDto dto)
    {
        var (success, message, response) = await _authService.LoginAsync(dto);
        if (!success) return Unauthorized(new { message });
        return Ok(response);
    }
}
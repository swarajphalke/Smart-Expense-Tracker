using AutoMapper;
using backend.DTOs;
using backend.Helpers;
using backend.Models;
using backend.Repositories;

namespace backend.Services;

public interface IAuthService
{
    Task<(bool Success, string Message, AuthResponseDto? Response)> RegisterAsync(RegisterDto dto);
    Task<(bool Success, string Message, AuthResponseDto? Response)> LoginAsync(LoginDto dto);
}

public class AuthService : IAuthService
{
    private readonly IUserRepository _userRepo;
    private readonly JwtHelper _jwtHelper;
    private readonly IMapper _mapper;

    public AuthService(IUserRepository userRepo, JwtHelper jwtHelper, IMapper mapper)
    {
        _userRepo = userRepo;
        _jwtHelper = jwtHelper;
        _mapper = mapper;
    }

    public async Task<(bool, string, AuthResponseDto?)> RegisterAsync(RegisterDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Name) || dto.Name.Length < 2)
            return (false, "Name must be at least 2 characters.", null);

        if (!IsValidEmail(dto.Email))
            return (false, "Invalid email address.", null);

        if (dto.Password.Length < 6)
            return (false, "Password must be at least 6 characters.", null);

        if (dto.Password == null || dto.Password.Length < 6)
            return (false, "Password must be at least 6 characters.", null);

        if (await _userRepo.EmailExistsAsync(dto.Email))
            return (false, "Email already registered.", null);

        var user = new User
        {
            Name = dto.Name.Trim(),
            Email = dto.Email.Trim().ToLower(),
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password)
        };

        var created = await _userRepo.CreateAsync(user);
        var token = _jwtHelper.GenerateToken(created);

        return (true, "Registration successful.", new AuthResponseDto(token, _mapper.Map<UserDto>(created)));
    }

    public async Task<(bool, string, AuthResponseDto?)> LoginAsync(LoginDto dto)
    {
        var user = await _userRepo.GetByEmailAsync(dto.Email);
        if (user == null || !BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash))
            return (false, "Invalid email or password.", null);

        var token = _jwtHelper.GenerateToken(user);
        return (true, "Login successful.", new AuthResponseDto(token, _mapper.Map<UserDto>(user)));
    }

    private static bool IsValidEmail(string email) =>
        System.Text.RegularExpressions.Regex.IsMatch(email,
            @"^[^@\s]+@[^@\s]+\.[^@\s]+$");
}
using AutoMapper;
using backend.DTOs;
using backend.Models;


namespace backend.Helpers;

public class MappingProfile : Profile
{
    public MappingProfile()
    {
        CreateMap<User, UserDto>();
        CreateMap<Expense, ExpenseDto>();
        CreateMap<CreateExpenseDto, Expense>();
        CreateMap<UpdateExpenseDto, Expense>();
    }
}
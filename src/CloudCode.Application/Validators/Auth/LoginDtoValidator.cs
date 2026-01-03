using CloudCode.Application.DTOs.Auth;
using FluentValidation;

namespace CloudCode.Application.Validators.Auth;

public class LoginDtoValidator : AbstractValidator<LoginDto>
{
    public LoginDtoValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("L'email est requis")
            .EmailAddress().WithMessage("Format d'email invalide");

        RuleFor(x => x.Password)
            .NotEmpty().WithMessage("Le mot de passe est requis");
    }
}

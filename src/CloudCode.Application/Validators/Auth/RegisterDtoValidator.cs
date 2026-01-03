using CloudCode.Application.DTOs.Auth;
using FluentValidation;

namespace CloudCode.Application.Validators.Auth;

public class RegisterDtoValidator : AbstractValidator<RegisterDto>
{
    public RegisterDtoValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("L'email est requis")
            .EmailAddress().WithMessage("Format d'email invalide")
            .MaximumLength(255).WithMessage("L'email ne peut pas dépasser 255 caractères");

        RuleFor(x => x.Username)
            .NotEmpty().WithMessage("Le nom d'utilisateur est requis")
            .MinimumLength(3).WithMessage("Le nom d'utilisateur doit contenir au moins 3 caractères")
            .MaximumLength(50).WithMessage("Le nom d'utilisateur ne peut pas dépasser 50 caractères")
            .Matches("^[a-zA-Z0-9_-]+$").WithMessage("Le nom d'utilisateur ne peut contenir que des lettres, chiffres, tirets et underscores");

        RuleFor(x => x.Password)
            .NotEmpty().WithMessage("Le mot de passe est requis")
            .MinimumLength(8).WithMessage("Le mot de passe doit contenir au moins 8 caractères")
            .Matches("[A-Z]").WithMessage("Le mot de passe doit contenir au moins une majuscule")
            .Matches("[a-z]").WithMessage("Le mot de passe doit contenir au moins une minuscule")
            .Matches("[0-9]").WithMessage("Le mot de passe doit contenir au moins un chiffre");

        RuleFor(x => x.ConfirmPassword)
            .Equal(x => x.Password).WithMessage("Les mots de passe ne correspondent pas");
    }
}

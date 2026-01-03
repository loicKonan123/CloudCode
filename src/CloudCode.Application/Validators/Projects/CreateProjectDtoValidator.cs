using CloudCode.Application.DTOs.Projects;
using FluentValidation;

namespace CloudCode.Application.Validators.Projects;

public class CreateProjectDtoValidator : AbstractValidator<CreateProjectDto>
{
    public CreateProjectDtoValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Le nom du projet est requis")
            .MinimumLength(2).WithMessage("Le nom doit contenir au moins 2 caractères")
            .MaximumLength(100).WithMessage("Le nom ne peut pas dépasser 100 caractères")
            .Matches("^[a-zA-Z0-9_-][a-zA-Z0-9_ -]*$").WithMessage("Le nom contient des caractères invalides");

        RuleFor(x => x.Description)
            .MaximumLength(500).WithMessage("La description ne peut pas dépasser 500 caractères")
            .When(x => x.Description != null);

        RuleFor(x => x.Language)
            .IsInEnum().WithMessage("Langage de programmation invalide");

        RuleFor(x => x.Tags)
            .Must(tags => tags == null || tags.Count <= 10)
            .WithMessage("Maximum 10 tags autorisés")
            .ForEach(tag => tag
                .MaximumLength(30).WithMessage("Chaque tag ne peut pas dépasser 30 caractères"));
    }
}

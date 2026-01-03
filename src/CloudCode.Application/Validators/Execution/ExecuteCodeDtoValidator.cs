using CloudCode.Application.DTOs.Execution;
using FluentValidation;

namespace CloudCode.Application.Validators.Execution;

public class ExecuteCodeDtoValidator : AbstractValidator<ExecuteCodeDto>
{
    public ExecuteCodeDtoValidator()
    {
        RuleFor(x => x.ProjectId)
            .NotEmpty().WithMessage("L'ID du projet est requis");

        RuleFor(x => x.FileId)
            .NotEmpty().WithMessage("L'ID du fichier est requis");

        RuleFor(x => x.Code)
            .NotEmpty().WithMessage("Le code est requis")
            .MaximumLength(100_000).WithMessage("Le code ne peut pas dépasser 100 Ko");

        RuleFor(x => x.Language)
            .IsInEnum().WithMessage("Langage de programmation invalide");

        RuleFor(x => x.TimeoutSeconds)
            .InclusiveBetween(1, 30).WithMessage("Le timeout doit être entre 1 et 30 secondes");

        RuleFor(x => x.Input)
            .MaximumLength(10_000).WithMessage("L'input ne peut pas dépasser 10 Ko")
            .When(x => x.Input != null);
    }
}

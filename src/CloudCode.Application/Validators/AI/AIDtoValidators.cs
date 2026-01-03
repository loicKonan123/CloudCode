using CloudCode.Application.DTOs.AI;
using FluentValidation;

namespace CloudCode.Application.Validators.AI;

public class ExplainCodeDtoValidator : AbstractValidator<ExplainCodeDto>
{
    public ExplainCodeDtoValidator()
    {
        RuleFor(x => x.Code)
            .NotEmpty().WithMessage("Le code est requis")
            .MaximumLength(50000).WithMessage("Le code ne peut pas dépasser 50 Ko");

        RuleFor(x => x.Language)
            .NotEmpty().WithMessage("Le langage est requis")
            .MaximumLength(50).WithMessage("Le langage ne peut pas dépasser 50 caractères");
    }
}

public class FixCodeDtoValidator : AbstractValidator<FixCodeDto>
{
    public FixCodeDtoValidator()
    {
        RuleFor(x => x.Code)
            .NotEmpty().WithMessage("Le code est requis")
            .MaximumLength(50000).WithMessage("Le code ne peut pas dépasser 50 Ko");

        RuleFor(x => x.Error)
            .NotEmpty().WithMessage("L'erreur est requise")
            .MaximumLength(5000).WithMessage("L'erreur ne peut pas dépasser 5 Ko");

        RuleFor(x => x.Language)
            .NotEmpty().WithMessage("Le langage est requis");
    }
}

public class GenerateCodeDtoValidator : AbstractValidator<GenerateCodeDto>
{
    public GenerateCodeDtoValidator()
    {
        RuleFor(x => x.Prompt)
            .NotEmpty().WithMessage("Le prompt est requis")
            .MaximumLength(5000).WithMessage("Le prompt ne peut pas dépasser 5000 caractères");

        RuleFor(x => x.Language)
            .NotEmpty().WithMessage("Le langage est requis");
    }
}

public class CompletionDtoValidator : AbstractValidator<CompletionDto>
{
    public CompletionDtoValidator()
    {
        RuleFor(x => x.Code)
            .NotEmpty().WithMessage("Le code est requis")
            .MaximumLength(50000).WithMessage("Le code ne peut pas dépasser 50 Ko");

        RuleFor(x => x.CursorPosition)
            .GreaterThanOrEqualTo(0).WithMessage("La position du curseur doit être positive");

        RuleFor(x => x.Language)
            .NotEmpty().WithMessage("Le langage est requis");
    }
}

public class DocumentCodeDtoValidator : AbstractValidator<DocumentCodeDto>
{
    public DocumentCodeDtoValidator()
    {
        RuleFor(x => x.Code)
            .NotEmpty().WithMessage("Le code est requis")
            .MaximumLength(50000).WithMessage("Le code ne peut pas dépasser 50 Ko");

        RuleFor(x => x.Language)
            .NotEmpty().WithMessage("Le langage est requis");
    }
}

public class RefactorCodeDtoValidator : AbstractValidator<RefactorCodeDto>
{
    public RefactorCodeDtoValidator()
    {
        RuleFor(x => x.Code)
            .NotEmpty().WithMessage("Le code est requis")
            .MaximumLength(50000).WithMessage("Le code ne peut pas dépasser 50 Ko");

        RuleFor(x => x.Instructions)
            .NotEmpty().WithMessage("Les instructions sont requises")
            .MaximumLength(2000).WithMessage("Les instructions ne peuvent pas dépasser 2000 caractères");

        RuleFor(x => x.Language)
            .NotEmpty().WithMessage("Le langage est requis");
    }
}

public class OptimizeCodeDtoValidator : AbstractValidator<OptimizeCodeDto>
{
    public OptimizeCodeDtoValidator()
    {
        RuleFor(x => x.Code)
            .NotEmpty().WithMessage("Le code est requis")
            .MaximumLength(50000).WithMessage("Le code ne peut pas dépasser 50 Ko");

        RuleFor(x => x.Language)
            .NotEmpty().WithMessage("Le langage est requis");
    }
}

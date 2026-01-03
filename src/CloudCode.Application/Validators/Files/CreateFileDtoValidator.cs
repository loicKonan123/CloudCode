using CloudCode.Application.DTOs.Files;
using FluentValidation;

namespace CloudCode.Application.Validators.Files;

public class CreateFileDtoValidator : AbstractValidator<CreateFileDto>
{
    private static readonly string[] ForbiddenNames = { "CON", "PRN", "AUX", "NUL", "COM1", "LPT1" };

    public CreateFileDtoValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Le nom du fichier est requis")
            .MaximumLength(255).WithMessage("Le nom ne peut pas dépasser 255 caractères")
            .Matches(@"^[^<>:""/\\|?*\x00-\x1F]+$").WithMessage("Le nom contient des caractères invalides")
            .Must(name => !ForbiddenNames.Contains(name.ToUpperInvariant()))
            .WithMessage("Ce nom de fichier est réservé par le système");

        RuleFor(x => x.Content)
            .MaximumLength(1_000_000).WithMessage("Le contenu ne peut pas dépasser 1 Mo")
            .When(x => !x.IsFolder && x.Content != null);
    }
}

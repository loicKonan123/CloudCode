using CloudCode.Application.DTOs.Collaboration;
using FluentValidation;

namespace CloudCode.Application.Validators.Collaboration;

public class InviteCollaboratorDtoValidator : AbstractValidator<InviteCollaboratorDto>
{
    public InviteCollaboratorDtoValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("L'email est requis")
            .EmailAddress().WithMessage("L'email n'est pas valide")
            .MaximumLength(256).WithMessage("L'email ne peut pas dépasser 256 caractères");

        RuleFor(x => x.Role)
            .IsInEnum().WithMessage("Le rôle n'est pas valide");
    }
}

public class UpdateCollaboratorRoleDtoValidator : AbstractValidator<UpdateCollaboratorRoleDto>
{
    public UpdateCollaboratorRoleDtoValidator()
    {
        RuleFor(x => x.Role)
            .IsInEnum().WithMessage("Le rôle n'est pas valide");
    }
}

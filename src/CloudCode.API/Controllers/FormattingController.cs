using CloudCode.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CloudCode.Controllers;

public class FormatCodeDto
{
    public string Code { get; set; } = string.Empty;
    public string Language { get; set; } = string.Empty;
}

/// <summary>
/// Contrôleur de formatage du code source.
/// </summary>
[Authorize]
public class FormattingController : BaseApiController
{
    private readonly IFormattingService _formattingService;

    public FormattingController(IFormattingService formattingService)
    {
        _formattingService = formattingService;
    }

    /// <summary>
    /// Formate un code source selon le langage.
    /// </summary>
    [HttpPost("format")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<ActionResult> FormatCode([FromBody] FormatCodeDto dto, CancellationToken cancellationToken)
    {
        var result = await _formattingService.FormatAsync(dto.Code, dto.Language, cancellationToken);
        return Ok(result);
    }
}

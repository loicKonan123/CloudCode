using CloudCode.Application.DTOs.AI;
using CloudCode.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CloudCode.Controllers;

/// <summary>
/// Contrôleur d'assistance IA pour le code.
/// </summary>
[Authorize]
public class AIController : BaseApiController
{
    private readonly IAIService _aiService;

    public AIController(IAIService aiService)
    {
        _aiService = aiService;
    }

    /// <summary>
    /// Expliquer du code.
    /// </summary>
    [HttpPost("explain")]
    [ProducesResponseType(typeof(AIResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<AIResponseDto>> ExplainCode([FromBody] ExplainCodeDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Code))
        {
            return BadRequest(new { error = "Le code est requis" });
        }

        var result = await _aiService.ExplainCodeAsync(dto.Code, dto.Language);
        return Ok(new AIResponseDto { Result = result });
    }

    /// <summary>
    /// Corriger du code avec une erreur.
    /// </summary>
    [HttpPost("fix")]
    [ProducesResponseType(typeof(AIResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<AIResponseDto>> FixCode([FromBody] FixCodeDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Code) || string.IsNullOrWhiteSpace(dto.Error))
        {
            return BadRequest(new { error = "Le code et l'erreur sont requis" });
        }

        var result = await _aiService.FixCodeAsync(dto.Code, dto.Error, dto.Language);
        return Ok(new AIResponseDto { Result = result });
    }

    /// <summary>
    /// Générer du code à partir d'une description.
    /// </summary>
    [HttpPost("generate")]
    [ProducesResponseType(typeof(AIResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<AIResponseDto>> GenerateCode([FromBody] GenerateCodeDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Prompt))
        {
            return BadRequest(new { error = "Le prompt est requis" });
        }

        var result = await _aiService.GenerateCodeAsync(dto.Prompt, dto.Language);
        return Ok(new AIResponseDto { Result = result });
    }

    /// <summary>
    /// Obtenir des suggestions d'autocomplétion.
    /// </summary>
    [HttpPost("completions")]
    [ProducesResponseType(typeof(CompletionResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<CompletionResponseDto>> GetCompletions([FromBody] CompletionDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Code))
        {
            return BadRequest(new { error = "Le code est requis" });
        }

        var suggestions = await _aiService.GetCompletionsAsync(dto.Code, dto.CursorPosition, dto.Language);
        return Ok(new CompletionResponseDto { Suggestions = suggestions });
    }

    /// <summary>
    /// Documenter du code.
    /// </summary>
    [HttpPost("document")]
    [ProducesResponseType(typeof(AIResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<AIResponseDto>> DocumentCode([FromBody] DocumentCodeDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Code))
        {
            return BadRequest(new { error = "Le code est requis" });
        }

        var result = await _aiService.DocumentCodeAsync(dto.Code, dto.Language);
        return Ok(new AIResponseDto { Result = result });
    }

    /// <summary>
    /// Refactorer du code selon des instructions.
    /// </summary>
    [HttpPost("refactor")]
    [ProducesResponseType(typeof(AIResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<AIResponseDto>> RefactorCode([FromBody] RefactorCodeDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Code) || string.IsNullOrWhiteSpace(dto.Instructions))
        {
            return BadRequest(new { error = "Le code et les instructions sont requis" });
        }

        var result = await _aiService.RefactorCodeAsync(dto.Code, dto.Instructions, dto.Language);
        return Ok(new AIResponseDto { Result = result });
    }

    /// <summary>
    /// Optimiser du code.
    /// </summary>
    [HttpPost("optimize")]
    [ProducesResponseType(typeof(AIResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<AIResponseDto>> OptimizeCode([FromBody] OptimizeCodeDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Code))
        {
            return BadRequest(new { error = "Le code est requis" });
        }

        var result = await _aiService.OptimizeCodeAsync(dto.Code, dto.Language);
        return Ok(new AIResponseDto { Result = result });
    }
}

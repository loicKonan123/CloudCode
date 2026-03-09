using CloudCode.Application.DTOs.Challenges;
using CloudCode.Application.Interfaces;
using CloudCode.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CloudCode.Controllers;

[Authorize(Policy = "AdminOnly")]
[Route("api/admin/challenges")]
public class AdminChallengesController : BaseApiController
{
    private readonly IChallengeService _challengeService;

    public AdminChallengesController(IChallengeService challengeService)
    {
        _challengeService = challengeService;
    }

    [HttpPost("seed")]
    public async Task<ActionResult> Seed()
    {
        await ChallengeSeeder.SeedChallengesAsync(HttpContext.RequestServices);
        return Ok(new { message = "Challenges seeded successfully." });
    }

    [HttpGet]
    public async Task<ActionResult<List<ChallengeListItemDto>>> GetAll()
    {
        var challenges = await _challengeService.GetAllChallengesAsync();
        return Ok(challenges);
    }

    [HttpPost]
    public async Task<ActionResult<ChallengeDetailDto>> Create([FromBody] CreateChallengeDto dto)
    {
        var challenge = await _challengeService.CreateChallengeAsync(dto);
        return CreatedAtAction(nameof(Create), new { id = challenge.Id }, challenge);
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<ChallengeDetailDto>> Update(Guid id, [FromBody] UpdateChallengeDto dto)
    {
        try
        {
            var challenge = await _challengeService.UpdateChallengeAsync(id, dto);
            return Ok(challenge);
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }

    [HttpDelete("{id:guid}")]
    public async Task<ActionResult> Delete(Guid id)
    {
        try
        {
            await _challengeService.DeleteChallengeAsync(id);
            return NoContent();
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }

    [HttpPost("{id:guid}/publish")]
    public async Task<ActionResult<ChallengeDetailDto>> TogglePublish(Guid id)
    {
        try
        {
            var challenge = await _challengeService.TogglePublishAsync(id);
            return Ok(challenge);
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }
}

using System.Diagnostics;
using CloudCode.Application.DTOs.Challenges;
using CloudCode.Application.Interfaces;
using CloudCode.Domain.Entities;
using CloudCode.Domain.Enums;
using CloudCode.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;

namespace CloudCode.Infrastructure.Services;

public class JudgeService : IJudgeService
{
    private readonly ApplicationDbContext _db;
    private readonly IConfiguration _configuration;

    public JudgeService(ApplicationDbContext db, IConfiguration configuration)
    {
        _db = db;
        _configuration = configuration;
    }

    public async Task<JudgeResultDto> RunTestsAsync(Guid challengeId, string code, ChallengeLanguage language, bool visibleOnly)
    {
        var challenge = await _db.Challenges.FindAsync(challengeId);
        var testCases = await _db.TestCases
            .Where(t => t.ChallengeId == challengeId)
            .OrderBy(t => t.OrderIndex)
            .ToListAsync();

        if (visibleOnly)
            testCases = testCases.Where(t => !t.IsHidden).ToList();

        var finalCode = BuildCode(code, language, challenge);
        return await ExecuteTests(testCases, finalCode, language, visibleOnly);
    }

    public async Task<JudgeResultDto> SubmitAsync(Guid challengeId, Guid userId, string code, ChallengeLanguage language)
    {
        var challenge = await _db.Challenges.FindAsync(challengeId);
        var testCases = await _db.TestCases
            .Where(t => t.ChallengeId == challengeId)
            .OrderBy(t => t.OrderIndex)
            .ToListAsync();

        var finalCode = BuildCode(code, language, challenge);
        var result = await ExecuteTests(testCases, finalCode, language, false);

        // Save submission
        var submission = new UserSubmission
        {
            UserId = userId,
            ChallengeId = challengeId,
            Language = language,
            Code = code,
            Status = result.Status,
            PassedTests = result.PassedTests,
            TotalTests = result.TotalTests,
            Score = result.Score,
            ExecutionTimeMs = result.TotalExecutionTimeMs,
            ErrorOutput = result.Results.FirstOrDefault(r => r.Error != null)?.Error,
            SubmittedAt = DateTime.UtcNow
        };

        _db.UserSubmissions.Add(submission);

        // Update user progress
        var progress = await _db.UserProgress
            .FirstOrDefaultAsync(p => p.UserId == userId && p.ChallengeId == challengeId);

        if (progress == null)
        {
            progress = new UserProgress
            {
                UserId = userId,
                ChallengeId = challengeId,
                BestScore = result.Score,
                IsSolved = result.Score == 100,
                AttemptCount = 1,
                LastAttemptAt = DateTime.UtcNow
            };
            _db.UserProgress.Add(progress);
        }
        else
        {
            progress.AttemptCount++;
            progress.LastAttemptAt = DateTime.UtcNow;
            if (result.Score > progress.BestScore)
            {
                progress.BestScore = result.Score;
            }
            if (result.Score == 100)
            {
                progress.IsSolved = true;
            }
        }

        // Mise à jour du streak journalier si challenge réussi à 100%
        if (result.Score == 100)
        {
            var user = await _db.Users.FindAsync(userId);
            if (user != null)
            {
                var today = DateTime.UtcNow.Date;
                var lastDate = user.LastChallengeSolvedDate?.Date;

                if (lastDate == null || lastDate < today.AddDays(-1))
                {
                    // Streak cassé (ou première fois) → repart à 1
                    user.ChallengeStreak = 1;
                }
                else if (lastDate == today.AddDays(-1))
                {
                    // Jour consécutif
                    user.ChallengeStreak++;
                }
                // Si lastDate == today, on ne change pas (déjà compté aujourd'hui)

                if (lastDate != today)
                {
                    user.LastChallengeSolvedDate = DateTime.UtcNow;
                    if (user.ChallengeStreak > user.BestChallengeStreak)
                        user.BestChallengeStreak = user.ChallengeStreak;
                }
            }
        }

        await _db.SaveChangesAsync();
        return result;
    }

    private async Task<JudgeResultDto> ExecuteTests(List<TestCase> testCases, string code, ChallengeLanguage language, bool visibleOnly)
    {
        var timeoutPerTest = _configuration.GetValue<int>("CodeExecution:TimeoutSeconds", 5);
        var results = new List<TestResultDto>();
        var totalStopwatch = Stopwatch.StartNew();

        foreach (var tc in testCases)
        {
            var testResult = await ExecuteSingleTest(code, language, tc, timeoutPerTest);
            testResult.IsHidden = tc.IsHidden && visibleOnly; // never happens if visibleOnly filtered
            results.Add(testResult);
        }

        totalStopwatch.Stop();

        var passedTests = results.Count(r => r.Passed);
        var totalTests = results.Count;
        var score = CalculateScore(passedTests, totalTests);

        var status = passedTests == totalTests
            ? SubmissionStatus.Passed
            : passedTests > 0
                ? SubmissionStatus.Failed
                : results.Any(r => r.Error?.Contains("timeout", StringComparison.OrdinalIgnoreCase) == true)
                    ? SubmissionStatus.Timeout
                    : SubmissionStatus.Failed;

        return new JudgeResultDto
        {
            Status = status,
            PassedTests = passedTests,
            TotalTests = totalTests,
            Score = score,
            TotalExecutionTimeMs = totalStopwatch.Elapsed.TotalMilliseconds,
            Results = results
        };
    }

    private async Task<TestResultDto> ExecuteSingleTest(string code, ChallengeLanguage language, TestCase testCase, int timeoutSeconds)
    {
        var stopwatch = Stopwatch.StartNew();
        var (command, extension) = GetExecutionCommand(language);

        var tempFile = Path.Combine(Path.GetTempPath(), $"judge_{Guid.NewGuid()}{extension}");

        try
        {
            await File.WriteAllTextAsync(tempFile, code);

            var psi = new ProcessStartInfo
            {
                FileName = command,
                Arguments = tempFile,
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                RedirectStandardInput = true,
                UseShellExecute = false,
                CreateNoWindow = true
            };

            using var process = new Process { StartInfo = psi };
            var outputBuilder = new System.Text.StringBuilder();
            var errorBuilder = new System.Text.StringBuilder();

            process.OutputDataReceived += (_, e) => { if (e.Data != null) outputBuilder.AppendLine(e.Data); };
            process.ErrorDataReceived += (_, e) => { if (e.Data != null) errorBuilder.AppendLine(e.Data); };

            process.Start();
            process.BeginOutputReadLine();
            process.BeginErrorReadLine();

            // Send input
            if (!string.IsNullOrEmpty(testCase.Input))
            {
                await process.StandardInput.WriteAsync(testCase.Input);
            }
            process.StandardInput.Close();

            var completed = await Task.Run(() => process.WaitForExit(timeoutSeconds * 1000));
            stopwatch.Stop();

            if (!completed)
            {
                process.Kill(true);
                return new TestResultDto
                {
                    TestIndex = testCase.OrderIndex,
                    Description = testCase.Description,
                    Passed = false,
                    Input = testCase.Input,
                    ExpectedOutput = testCase.ExpectedOutput,
                    Error = $"Timeout after {timeoutSeconds}s",
                    ExecutionTimeMs = stopwatch.Elapsed.TotalMilliseconds
                };
            }

            var actualOutput = outputBuilder.ToString().TrimEnd();
            var errorOutput = errorBuilder.ToString().TrimEnd();
            var expectedOutput = testCase.ExpectedOutput.TrimEnd();

            // Normalize: trim each line + compare
            var passed = NormalizeOutput(actualOutput) == NormalizeOutput(expectedOutput);

            return new TestResultDto
            {
                TestIndex = testCase.OrderIndex,
                Description = testCase.Description,
                Passed = passed,
                Input = testCase.Input,
                ExpectedOutput = testCase.ExpectedOutput,
                ActualOutput = actualOutput,
                Error = string.IsNullOrEmpty(errorOutput) ? null : errorOutput,
                ExecutionTimeMs = stopwatch.Elapsed.TotalMilliseconds
            };
        }
        catch (Exception ex)
        {
            stopwatch.Stop();
            return new TestResultDto
            {
                TestIndex = testCase.OrderIndex,
                Description = testCase.Description,
                Passed = false,
                Input = testCase.Input,
                ExpectedOutput = testCase.ExpectedOutput,
                Error = ex.Message,
                ExecutionTimeMs = stopwatch.Elapsed.TotalMilliseconds
            };
        }
        finally
        {
            try { File.Delete(tempFile); } catch { }
        }
    }

    private static string BuildCode(string userCode, ChallengeLanguage language, Challenge? challenge)
    {
        if (challenge == null || !challenge.IsFunction)
            return userCode;

        var runner = language == ChallengeLanguage.JavaScript
            ? challenge.TestRunnerJavaScript
            : challenge.TestRunnerPython;

        if (string.IsNullOrWhiteSpace(runner))
            return userCode;

        return userCode + "\n\n" + runner;
    }

    private static (string Command, string Extension) GetExecutionCommand(ChallengeLanguage language)
    {
        return language switch
        {
            ChallengeLanguage.Python => ("python", ".py"),
            ChallengeLanguage.JavaScript => ("node", ".js"),
            _ => ("python", ".py") // default to Python for "Both"
        };
    }

    private static string NormalizeOutput(string output)
    {
        // Trim each line, remove trailing empty lines
        var lines = output.Split('\n')
            .Select(l => l.TrimEnd('\r').Trim())
            .ToList();

        // Remove trailing empty lines
        while (lines.Count > 0 && string.IsNullOrWhiteSpace(lines[^1]))
            lines.RemoveAt(lines.Count - 1);

        return string.Join("\n", lines);
    }

    private static int CalculateScore(int passed, int total)
    {
        if (total == 0) return 0;
        var ratio = (double)passed / total;
        return ratio switch
        {
            1.0 => 100,
            >= 0.8 => 75,
            >= 0.5 => 50,
            > 0 => 25,
            _ => 0
        };
    }
}

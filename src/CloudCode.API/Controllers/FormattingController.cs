using CloudCode.Application.DTOs.Formatting;
using CloudCode.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Diagnostics;
using System.Runtime.InteropServices;
using System.Text;

namespace CloudCode.Controllers;

/// <summary>
/// Contrôleur pour le formatage de code.
/// </summary>
[Authorize]
public class FormattingController : BaseApiController
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<FormattingController> _logger;

    public FormattingController(IConfiguration configuration, ILogger<FormattingController> logger)
    {
        _configuration = configuration;
        _logger = logger;
    }

    /// <summary>
    /// Formater du code selon le langage.
    /// </summary>
    [HttpPost("format")]
    public async Task<ActionResult<FormatCodeResultDto>> FormatCode([FromBody] FormatCodeDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Code))
        {
            return Ok(new FormatCodeResultDto
            {
                FormattedCode = dto.Code,
                Success = true
            });
        }

        try
        {
            var result = dto.Language switch
            {
                ProgrammingLanguage.JavaScript => await FormatWithPrettier(dto.Code, "babel", dto.TabSize, dto.UseTabs),
                ProgrammingLanguage.TypeScript => await FormatWithPrettier(dto.Code, "typescript", dto.TabSize, dto.UseTabs),
                ProgrammingLanguage.Python => await FormatWithBlack(dto.Code),
                _ => new FormatCodeResultDto
                {
                    FormattedCode = dto.Code,
                    Success = false,
                    Error = $"Le formatage n'est pas supporté pour le langage {dto.Language}"
                }
            };

            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erreur lors du formatage du code");
            return Ok(new FormatCodeResultDto
            {
                FormattedCode = dto.Code,
                Success = false,
                Error = "Une erreur est survenue lors du formatage"
            });
        }
    }

    #region Private Methods

    private async Task<FormatCodeResultDto> FormatWithPrettier(string code, string parser, int tabWidth, bool useTabs)
    {
        var tempFile = Path.Combine(Path.GetTempPath(), $"format_{Guid.NewGuid()}.tmp");

        try
        {
            await System.IO.File.WriteAllTextAsync(tempFile, code, Encoding.UTF8);

            // Construire les arguments Prettier
            var args = new StringBuilder();
            args.Append($"--parser {parser} ");
            args.Append($"--tab-width {tabWidth} ");
            args.Append(useTabs ? "--use-tabs " : "--no-use-tabs ");
            args.Append($"\"{tempFile}\"");

            var psi = new ProcessStartInfo
            {
                FileName = "npx",
                Arguments = $"prettier {args}",
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                UseShellExecute = false,
                CreateNoWindow = true
            };

            // Sur Windows, utiliser npx.cmd
            if (RuntimeInformation.IsOSPlatform(OSPlatform.Windows))
            {
                psi.FileName = "cmd.exe";
                psi.Arguments = $"/c npx prettier {args}";
            }

            using var process = new Process { StartInfo = psi };
            var outputBuilder = new StringBuilder();
            var errorBuilder = new StringBuilder();

            process.OutputDataReceived += (s, e) =>
            {
                if (e.Data != null) outputBuilder.AppendLine(e.Data);
            };
            process.ErrorDataReceived += (s, e) =>
            {
                if (e.Data != null) errorBuilder.AppendLine(e.Data);
            };

            process.Start();
            process.BeginOutputReadLine();
            process.BeginErrorReadLine();

            var completed = await Task.Run(() => process.WaitForExit(30000));

            if (!completed)
            {
                process.Kill(true);
                return new FormatCodeResultDto
                {
                    FormattedCode = code,
                    Success = false,
                    Error = "Timeout lors du formatage avec Prettier"
                };
            }

            var output = outputBuilder.ToString().TrimEnd();
            var error = errorBuilder.ToString();

            if (process.ExitCode != 0)
            {
                // Si Prettier n'est pas installé, suggérer l'installation
                if (error.Contains("not found") || error.Contains("'npx' is not recognized") || error.Contains("prettier"))
                {
                    return new FormatCodeResultDto
                    {
                        FormattedCode = code,
                        Success = false,
                        Error = "Prettier n'est pas installé. Exécutez 'npm install -g prettier' pour l'installer."
                    };
                }

                return new FormatCodeResultDto
                {
                    FormattedCode = code,
                    Success = false,
                    Error = $"Erreur de syntaxe dans le code: {error}"
                };
            }

            return new FormatCodeResultDto
            {
                FormattedCode = string.IsNullOrEmpty(output) ? code : output,
                Success = true
            };
        }
        finally
        {
            if (System.IO.File.Exists(tempFile))
            {
                try { System.IO.File.Delete(tempFile); } catch { }
            }
        }
    }

    private async Task<FormatCodeResultDto> FormatWithBlack(string code)
    {
        var tempFile = Path.Combine(Path.GetTempPath(), $"format_{Guid.NewGuid()}.py");

        try
        {
            await System.IO.File.WriteAllTextAsync(tempFile, code, Encoding.UTF8);

            var psi = new ProcessStartInfo
            {
                FileName = "black",
                Arguments = $"--quiet --fast \"{tempFile}\"",
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                UseShellExecute = false,
                CreateNoWindow = true
            };

            // Sur Windows, utiliser python -m black si black n'est pas dans le PATH
            if (RuntimeInformation.IsOSPlatform(OSPlatform.Windows))
            {
                psi.FileName = "python";
                psi.Arguments = $"-m black --quiet --fast \"{tempFile}\"";
            }

            using var process = new Process { StartInfo = psi };
            var errorBuilder = new StringBuilder();

            process.ErrorDataReceived += (s, e) =>
            {
                if (e.Data != null) errorBuilder.AppendLine(e.Data);
            };

            process.Start();
            process.BeginErrorReadLine();

            var completed = await Task.Run(() => process.WaitForExit(30000));

            if (!completed)
            {
                process.Kill(true);
                return new FormatCodeResultDto
                {
                    FormattedCode = code,
                    Success = false,
                    Error = "Timeout lors du formatage avec Black"
                };
            }

            var error = errorBuilder.ToString();

            if (process.ExitCode != 0)
            {
                // Si Black n'est pas installé
                if (error.Contains("No module named") || error.Contains("not found") || error.Contains("'python' is not recognized"))
                {
                    return new FormatCodeResultDto
                    {
                        FormattedCode = code,
                        Success = false,
                        Error = "Black n'est pas installé. Exécutez 'pip install black' pour l'installer."
                    };
                }

                // Erreur de syntaxe
                if (error.Contains("Cannot parse") || error.Contains("error:"))
                {
                    return new FormatCodeResultDto
                    {
                        FormattedCode = code,
                        Success = false,
                        Error = "Erreur de syntaxe dans le code Python"
                    };
                }

                return new FormatCodeResultDto
                {
                    FormattedCode = code,
                    Success = false,
                    Error = error
                };
            }

            // Lire le fichier formaté
            var formattedCode = await System.IO.File.ReadAllTextAsync(tempFile, Encoding.UTF8);

            return new FormatCodeResultDto
            {
                FormattedCode = formattedCode,
                Success = true
            };
        }
        finally
        {
            if (System.IO.File.Exists(tempFile))
            {
                try { System.IO.File.Delete(tempFile); } catch { }
            }
        }
    }

    #endregion
}

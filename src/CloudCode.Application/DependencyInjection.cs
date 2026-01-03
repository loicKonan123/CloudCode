using AutoMapper;
using CloudCode.Application.Mappings;
using FluentValidation;
using Microsoft.Extensions.DependencyInjection;

namespace CloudCode.Application;

/// <summary>
/// Extension pour configurer les services de la couche Application.
/// </summary>
public static class DependencyInjection
{
    public static IServiceCollection AddApplicationServices(this IServiceCollection services)
    {
        // AutoMapper
        var mapperConfig = new MapperConfiguration(cfg =>
        {
            cfg.AddProfile<MappingProfile>();
        });
        // Note: AssertConfigurationIsValid() supprimé pour permettre les mappings partiels
        services.AddSingleton(mapperConfig.CreateMapper());

        // FluentValidation - enregistre tous les validators de l'assembly
        services.AddValidatorsFromAssembly(typeof(DependencyInjection).Assembly);

        return services;
    }
}

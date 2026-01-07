# ===========================================
# Dockerfile pour CloudCode API
# Multi-stage build pour optimiser la taille
# ===========================================

# Stage 1: Build
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copier les fichiers de projet pour restaurer les dépendances
COPY ["src/CloudCode.API/CloudCode.API.csproj", "src/CloudCode.API/"]
COPY ["src/CloudCode.Application/CloudCode.Application.csproj", "src/CloudCode.Application/"]
COPY ["src/CloudCode.Domain/CloudCode.Domain.csproj", "src/CloudCode.Domain/"]
COPY ["src/CloudCode.Infrastructure/CloudCode.Infrastructure.csproj", "src/CloudCode.Infrastructure/"]

# Restaurer les dépendances
RUN dotnet restore "src/CloudCode.API/CloudCode.API.csproj"

# Copier tout le code source
COPY . .

# Build de l'application
WORKDIR "/src/src/CloudCode.API"
RUN dotnet build "CloudCode.API.csproj" -c Release -o /app/build

# Stage 2: Publish
FROM build AS publish
RUN dotnet publish "CloudCode.API.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Stage 3: Runtime
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app

# Créer un utilisateur non-root pour la sécurité
RUN adduser --disabled-password --gecos "" appuser && chown -R appuser /app
USER appuser

# Copier l'application publiée
COPY --from=publish /app/publish .

# Exposer le port
EXPOSE 8080

# Variables d'environnement
ENV ASPNETCORE_URLS=http://+:8080
ENV ASPNETCORE_ENVIRONMENT=Production

# Point d'entrée
ENTRYPOINT ["dotnet", "CloudCode.API.dll"]

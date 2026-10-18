# syntax=docker/dockerfile:1
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY Directory.Build.props .editorconfig HomeToHome.sln ./
COPY src/HomeToHome.Domain/HomeToHome.Domain.csproj src/HomeToHome.Domain/
COPY src/HomeToHome.Application/HomeToHome.Application.csproj src/HomeToHome.Application/
COPY src/HomeToHome.Infrastructure/HomeToHome.Infrastructure.csproj src/HomeToHome.Infrastructure/
COPY src/HomeToHome.Api/HomeToHome.Api.csproj src/HomeToHome.Api/
RUN dotnet restore src/HomeToHome.Api/HomeToHome.Api.csproj
COPY src/ src/
RUN dotnet publish src/HomeToHome.Api/HomeToHome.Api.csproj -c Release -o /app --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app
EXPOSE 8080
COPY --from=build /app .
USER $APP_UID
# Railway injects PORT; default to 8080 elsewhere.
ENTRYPOINT ["/bin/sh", "-c", "ASPNETCORE_HTTP_PORTS=${PORT:-8080} exec dotnet HomeToHome.Api.dll"]

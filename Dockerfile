# Використовуємо готовий образ Lampac
FROM ghcr.io/immisterio/lampac:latest

# Встановлюємо робочу директорію
WORKDIR /home

# Копіюємо всі модулі з репозиторію в правильну директорію
COPY . /home/module/

# Встановлюємо правильні дозволи
RUN chmod -R 755 /home/module/

# Відкриваємо стандартний порт Lampac
EXPOSE 9118

# Встановлюємо змінні середовища
ENV ASPNETCORE_URLS=http://+:9118

# Використовуємо стандартну команду запуску Lampac
ENTRYPOINT ["dotnet", "Lampac.dll"]

# Використовуємо готовий образ Lampac
FROM immisterio/lampac:latest

# Встановлюємо робочу директорію
WORKDIR /home

# Копіюємо всі модулі з репозиторію в правильну директорію
COPY . /home/module/

# Встановлюємо правильні дозволи
RUN chmod -R 755 /home/module/

# Відкриваємо стандартний порт Lampac
EXPOSE 80

# Встановлюємо змінні середовища
ENV ASPNETCORE_URLS=http://+:80

# Використовуємо стандартну команду запуску Lampac
ENTRYPOINT ["dotnet", "Lampac.dll"]

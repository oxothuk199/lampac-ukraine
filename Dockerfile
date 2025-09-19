# Базуємось на готовому Lampac-образі
FROM ghcr.io/oxothuk199/lampac-ukraine:latest

# Копіюємо українські модулі всередину контейнера
COPY UAflix /home/module/UAflix
COPY Unimay /home/module/Unimay
COPY Cikavaldeya /home/module/Cikavaldeya

# Порт, на якому працює Lampac
EXPOSE 9118

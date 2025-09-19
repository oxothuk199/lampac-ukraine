FROM ghcr.io/immisterio/lampac:latest

# Копіюємо українські модулі всередину контейнера
COPY UAflix /home/module/UAflix
COPY Unimay /home/module/Unimay
COPY Cikavaldeya /home/module/Cikavaldeya

@echo off
echo Iniciando el proceso de Dockerizacion...
echo Esto puede tomar unos minutos la primera vez mientras descarga y compila el proyecto.
echo.

docker-compose up --build -d

echo.
echo ========================================================
echo Los contenedores se estan ejecutando en segundo plano.
echo Frontend web: http://localhost
echo Backend API:  http://localhost:8080
echo ========================================================
echo.
pause

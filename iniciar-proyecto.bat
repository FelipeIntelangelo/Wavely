@echo off
setlocal
cd /d "%~dp0"

echo ==========================================
echo    LEVANTANDO STACK DE WAVELY
echo ==========================================
echo.

:: Verificar si Docker esta corriendo
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker no parece estar iniciado.
    echo Por favor, abre Docker Desktop primero.
    pause
    exit /b
)

:: Levantar contenedores
echo [1/2] Iniciando contenedores y recompilando si hay cambios...
docker compose up -d --build

if %errorlevel% neq 0 (
    echo [ERROR] Hubo un problema al levantar Docker Compose.
    pause
    exit /b
)

echo.
echo [2/2] STACK INICIADO CORRECTAMENTE
echo.
echo ------------------------------------------
echo  Frontend:  http://localhost
echo  Backend:   http://localhost:8080
echo  Swagger:   http://localhost:8080/swagger-ui/index.html
echo ------------------------------------------
echo.

:MENU
echo ==========================================
echo   MENU DE LOGS
echo ==========================================
echo  [1] Ver logs del BACKEND  (Spring Boot)
echo  [2] Ver logs del FRONTEND (Angular/Nginx)
echo  [3] Ver logs de AMBOS a la vez
echo  [4] Ver estado de los contenedores
echo  [N] No ver logs y salir
echo ==========================================
set /p choice="Selecciona una opcion: "

if /i "%choice%"=="1" goto LOGS_BACKEND
if /i "%choice%"=="2" goto LOGS_FRONTEND
if /i "%choice%"=="3" goto LOGS_ALL
if /i "%choice%"=="4" goto STATUS
if /i "%choice%"=="N" goto FIN
echo Opcion invalida, intenta de nuevo.
echo.
goto MENU

:LOGS_BACKEND
echo.
echo [BACKEND - podcast_backend] Mostrando logs en tiempo real...
echo Presiona Ctrl+C para volver al menu.
echo.
docker logs -f --tail=100 podcast_backend
echo.
goto MENU

:LOGS_FRONTEND
echo.
echo [FRONTEND - podcast_frontend] Mostrando logs en tiempo real...
echo Presiona Ctrl+C para volver al menu.
echo.
docker logs -f --tail=100 podcast_frontend
echo.
goto MENU

:LOGS_ALL
echo.
echo [TODOS LOS SERVICIOS] Mostrando logs en tiempo real...
echo Presiona Ctrl+C para volver al menu.
echo.
docker compose logs -f --tail=50
echo.
goto MENU

:STATUS
echo.
echo ==========================================
echo   ESTADO ACTUAL DE LOS CONTENEDORES
echo ==========================================
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo.
goto MENU

:FIN
echo.
echo Saliendo. Los contenedores siguen corriendo en segundo plano.
echo Para detenerlos, usa: docker compose down
echo.
pause

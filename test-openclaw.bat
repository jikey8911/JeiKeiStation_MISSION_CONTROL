@echo off
REM Script para probar OpenClaw y medir tiempo de respuesta del primer mensaje

setlocal enabledelayedexpansion

set OPENCLAW_URL=http://localhost:5000
set TIMEOUT=60

echo.
echo ⏱️  Iniciando prueba de OpenClaw...
echo 📡 URL: %OPENCLAW_URL%
echo ⏳ Esperando que OpenClaw esté listo...
echo.

REM Esperar a que OpenClaw esté disponible
for /L %%i in (1,1,30) do (
    timeout /t 2 /nobreak > nul
    powershell -Command "try { $response = Invoke-WebRequest -Uri '%OPENCLAW_URL%/health' -UseBasicParsing -TimeoutSec 5; if ($response.StatusCode -eq 200) { exit 0 } } catch { }; exit 1"
    if !ERRORLEVEL! equ 0 (
        echo ✅ OpenClaw está listo!
        goto ready
    )
    echo ⏳ Intento %%i/30...
)

:ready
echo.
echo 📤 Enviando mensaje de prueba...
echo.

REM Crear timestamp
for /f "tokens=2-4 delims=/ " %%a in ('date /t') do (set datestamp=%%c%%a%%b)
for /f "tokens=1-2 delims=/:" %%a in ('time /t') do (set timestamp=%%a%%b)
set session_id=test-session-%datestamp%-%timestamp%

REM Enviar mensaje con PowerShell para mejor soporte JSON
powershell -Command "^
$startTime = [datetime]::Now; ^
$body = @{ ^
    message = 'Hola, ¿cuál es tu nombre y qué puedes hacer?'; ^
    agent_id = 'user-assistant'; ^
    session_id = '%session_id%' ^
} | ConvertTo-Json; ^
try { ^
    $response = Invoke-RestMethod -Uri '%OPENCLAW_URL%/api/chat' -Method POST -Body $body -ContentType 'application/json' -TimeoutSec %TIMEOUT%; ^
    $endTime = [datetime]::Now; ^
    $elapsed = ($endTime - $startTime).TotalMilliseconds; ^
    Write-Host ''; ^
    Write-Host '✅ Respuesta recibida:'; ^
    Write-Host ($response | ConvertTo-Json -Depth 10); ^
    Write-Host ''; ^
    Write-Host '════════════════════════════════════════'; ^
    Write-Host \"⏱️  TIEMPO DE RESPUESTA: $([Math]::Round($elapsed))ms\"; ^
    Write-Host '════════════════════════════════════════'; ^
    Write-Host ''; ^
    if ($elapsed -lt 5000) { Write-Host '⚡ Respuesta RÁPIDA - Excelente rendimiento' } ^
    elseif ($elapsed -lt 15000) { Write-Host '✅ Respuesta NORMAL - Rendimiento aceptable' } ^
    elseif ($elapsed -lt 30000) { Write-Host '⚠️  Respuesta LENTA - Considera optimizar' } ^
    else { Write-Host '❌ Respuesta MUY LENTA - Problemas de rendimiento' } ^
} catch { ^
    Write-Host \"❌ Error: $_\"; ^
    exit 1 ^
} ^
"

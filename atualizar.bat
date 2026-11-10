@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo ============================================
echo   Brownily - atualizando o cardapio
echo ============================================
echo.
node ferramentas\atualizar.js %*
if errorlevel 1 (
  echo.
  echo Algo deu errado. Mande um print desta janela para o Claude.
) else (
  echo.
  echo Tudo certo.
)
pause

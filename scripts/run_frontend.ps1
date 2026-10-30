$ErrorActionPreference = 'Stop'

Set-Location (Join-Path (Split-Path -Parent $PSScriptRoot) 'frontend')
npm start -- --host 127.0.0.1 --port 4200

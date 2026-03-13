---
description: Cómo habilitar systemd en WSL2 para soportar servicios de fondo y OpenClaw avanzado
---

1. WSL2 necesita tener systemd habilitado: edita `/etc/wsl.conf` con las siguientes líneas:
```ini
[boot]
systemd=true
```

2. Luego ejecuta: `wsl --shutdown` (desde PowerShell) y vuelve a abrir tu distribución.

3. Verifica el estado: `systemctl --user status`

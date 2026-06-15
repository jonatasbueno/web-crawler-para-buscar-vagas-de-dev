#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
SYSTEMD_USER_DIR="${XDG_CONFIG_HOME:-$HOME/.config}/systemd/user"

if [[ "$PROJECT_DIR" == *'|'* ]] || [[ "$PROJECT_DIR" == *$'\n'* ]]; then
  echo "Caminho do projeto inválido para instalação do cron." >&2
  exit 1
fi

mkdir -p "$SYSTEMD_USER_DIR" "$PROJECT_DIR/data"

install_unit() {
  local template="$1"
  local dest="$2"
  sed "s|__PROJECT_DIR__|$PROJECT_DIR|g" "$template" > "$dest"
}

# Services agendados (slots 08h, 13h, 20h)
for slot in 08h 13h 20h; do
  install_unit "$PROJECT_DIR/systemd/crawler-vagas-dev-${slot}.service" \
    "$SYSTEMD_USER_DIR/crawler-vagas-dev-${slot}.service"

  cp "$PROJECT_DIR/systemd/crawler-vagas-dev-${slot}.timer" \
    "$SYSTEMD_USER_DIR/crawler-vagas-dev-${slot}.timer"
done

# Service de catch-up (roda no boot)
install_unit "$PROJECT_DIR/systemd/crawler-vagas-dev-catchup.service" \
  "$SYSTEMD_USER_DIR/crawler-vagas-dev-catchup.service"

systemctl --user daemon-reload

# Habilita e inicia os timers
for slot in 08h 13h 20h; do
  systemctl --user enable --now "crawler-vagas-dev-${slot}.timer"
done

# Habilita o catch-up
systemctl --user enable --now crawler-vagas-dev-catchup.service

echo ""
echo "Timers instalados. Próximas execuções:"
systemctl --user list-timers crawler-vagas-dev-*.timer
echo ""
echo "Catch-up habilitado: roda ao ligar o PC e executa slots pendentes do dia."
echo ""
echo "Alternativa com crontab tradicional: veja scripts/crontab.example"
echo ""
echo "Para os timers funcionarem sem login ativo, execute:"
echo "  loginctl enable-linger \"\$USER\""

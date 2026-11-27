#!/usr/bin/env bash
# Controla o ops/scheduler.sh rodando em segundo plano nesta máquina.
#
# Uso:
#   schedulerctl.sh start              inicia em segundo plano (sobrevive ao fechar o terminal)
#   schedulerctl.sh stop               encerra o agendador (a stack fica como está)
#   schedulerctl.sh restart            stop + start
#   schedulerctl.sh status             agendador, estado desejado agora e contêineres
#   schedulerctl.sh logs               acompanha o log (Ctrl+C para sair)
#   schedulerctl.sh autostart on|off   inicia junto com o sistema (serviço systemd do usuário)
#
# As mesmas variáveis GYMBRO_* do scheduler.sh valem aqui e são repassadas a ele.
set -Eeuo pipefail

SCRIPT_DIR=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
readonly SCRIPT_DIR
readonly SCHEDULER="$SCRIPT_DIR/scheduler.sh"
readonly STATE_DIR=${GYMBRO_STATE_DIR:-${XDG_STATE_HOME:-$HOME/.local/state}/gymbro}
readonly PID_FILE="$STATE_DIR/scheduler.pid"
readonly LOG_FILE="$STATE_DIR/scheduler.log"
readonly MAX_LOG_BYTES=$((5 * 1024 * 1024))
readonly UNIT_NAME=gymbro-scheduler.service
readonly UNIT_FILE="${XDG_CONFIG_HOME:-$HOME/.config}/systemd/user/$UNIT_NAME"

die() { printf 'erro: %s\n' "$1" >&2; exit "${2:-1}"; }

usage() { sed -n '4,12p' "$0" | sed 's/^# \{0,1\}//'; }

running_pid() {
  local pid
  [[ -f $PID_FILE ]] || return 1
  pid=$(<"$PID_FILE")
  [[ $pid =~ ^[0-9]+$ ]] && kill -0 "$pid" 2>/dev/null || return 1
  echo "$pid"
}

autostart_active() {
  command -v systemctl > /dev/null && systemctl --user is-active --quiet "$UNIT_NAME" 2>/dev/null
}

rotate_log() {
  [[ -f $LOG_FILE ]] || return 0
  (( $(stat -c %s -- "$LOG_FILE") < MAX_LOG_BYTES )) || mv -f -- "$LOG_FILE" "$LOG_FILE.1"
}

start() {
  local pid
  if autostart_active; then
    echo "o agendador já roda pelo systemd ($UNIT_NAME); use: $0 autostart off"
    return 0
  fi
  if pid=$(running_pid); then
    echo "o agendador já está rodando (pid $pid)"
    return 0
  fi

  mkdir -p -- "$STATE_DIR"
  rotate_log
  # setsid + nohup: sai da sessão do terminal e ignora o SIGHUP de quando ele fecha
  nohup setsid "$SCHEDULER" run >> "$LOG_FILE" 2>&1 < /dev/null &
  pid=$!
  echo "$pid" > "$PID_FILE"

  sleep 1
  if kill -0 "$pid" 2>/dev/null; then
    echo "agendador iniciado (pid $pid), log em $LOG_FILE"
  else
    rm -f -- "$PID_FILE"
    tail -n 5 -- "$LOG_FILE" >&2 || true
    die "o agendador não subiu; veja o log acima"
  fi
}

stop() {
  local pid
  if ! pid=$(running_pid); then
    rm -f -- "$PID_FILE"
    echo "o agendador não está rodando"
    return 0
  fi

  kill -TERM "$pid"
  for _ in $(seq 1 20); do
    kill -0 "$pid" 2>/dev/null || break
    sleep 0.5
  done
  kill -0 "$pid" 2>/dev/null && die "o processo $pid não encerrou em 10s"
  rm -f -- "$PID_FILE"
  echo "agendador encerrado (a stack fica como está)"
}

status() {
  local pid
  if autostart_active; then
    echo "agendador: rodando pelo systemd ($UNIT_NAME)"
  elif pid=$(running_pid); then
    echo "agendador: rodando (pid $pid)"
  else
    echo "agendador: parado"
  fi
  echo "estado desejado agora: $("$SCHEDULER" desired)"
  echo
  docker compose --project-directory "$SCRIPT_DIR/.." -f "$SCRIPT_DIR/../compose.yaml" ps
}

logs() {
  if autostart_active; then
    exec journalctl --user -u "$UNIT_NAME" -n 50 -f
  fi
  [[ -f $LOG_FILE ]] || die "ainda não há log em $LOG_FILE"
  exec tail -n 50 -f -- "$LOG_FILE"
}

autostart() {
  command -v systemctl > /dev/null || die "systemd não encontrado nesta máquina"
  case ${1:-} in
    on)
      stop
      mkdir -p -- "$(dirname -- "$UNIT_FILE")"
      cat > "$UNIT_FILE" <<EOF
[Unit]
Description=Gymbro: liga e desliga a stack Docker por horário
After=default.target

[Service]
Type=simple
ExecStart=$SCHEDULER run
Restart=on-failure
RestartSec=30

[Install]
WantedBy=default.target
EOF
      systemctl --user daemon-reload
      systemctl --user enable --now "$UNIT_NAME"
      echo "autostart ligado: $UNIT_FILE"
      echo "para rodar mesmo sem sessão aberta: loginctl enable-linger $USER"
      ;;
    off)
      systemctl --user disable --now "$UNIT_NAME" 2>/dev/null || true
      rm -f -- "$UNIT_FILE"
      systemctl --user daemon-reload
      echo "autostart desligado"
      ;;
    *) die "use: $0 autostart on|off" 2 ;;
  esac
}

case ${1:-} in
  start) start ;;
  stop) stop ;;
  restart) stop; start ;;
  status) status ;;
  logs) logs ;;
  autostart) autostart "${2:-}" ;;
  -h | --help | help) usage ;;
  *) usage >&2; exit 2 ;;
esac

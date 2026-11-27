#!/usr/bin/env bash
# Liga e desliga a stack Docker do Gymbro (compose.yaml da raiz) por horário, todos os dias.
#
# Em vez de disparar num minuto exato, reconcilia: a cada GYMBRO_CHECK_INTERVAL segundos compara o
# estado desejado para a hora atual com o que está rodando e corrige a diferença. Assim funciona
# depois de o computador dormir ou reiniciar, e desfaz quem subir ou derrubar a stack à mão.
#
# Uso:
#   scheduler.sh run       laço infinito (em segundo plano: ops/schedulerctl.sh start)
#   scheduler.sh once      uma rodada de reconciliação
#   scheduler.sh desired   imprime "running" ou "stopped" para a hora atual
#
# Configuração (variáveis de ambiente):
#   GYMBRO_STOP_AT=07:00       desliga a partir deste horário (hora local da máquina)
#   GYMBRO_START_AT=16:20      liga de novo a partir deste horário
#   GYMBRO_CHECK_INTERVAL=30   segundos entre verificações
#   GYMBRO_STATE_DIR           pasta da trava de instância única (padrão ~/.local/state/gymbro)
#   GYMBRO_NOW=HH:MM           só para testes: finge que é esse horário
set -Eeuo pipefail

SCRIPT_DIR=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
readonly SCRIPT_DIR
REPO_ROOT=$(cd -- "$SCRIPT_DIR/.." && pwd)
readonly REPO_ROOT

readonly STOP_AT=${GYMBRO_STOP_AT:-07:00}
readonly START_AT=${GYMBRO_START_AT:-16:20}
readonly CHECK_INTERVAL=${GYMBRO_CHECK_INTERVAL:-30}
readonly STATE_DIR=${GYMBRO_STATE_DIR:-${XDG_STATE_HOME:-$HOME/.local/state}/gymbro}

sleep_pid=""

log() { printf '%s %s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$*"; }
error() { log "ERRO: $*" >&2; }
die() { error "$1"; exit "${2:-1}"; }

usage() {
  cat <<EOF
Uso: $(basename -- "$0") run|once|desired

  run       laço infinito: mantém a stack desligada das $STOP_AT às $START_AT
  once      uma rodada de reconciliação
  desired   imprime o estado desejado agora (running ou stopped)
EOF
}

# "HH:MM" → minutos desde a meia-noite; falha para qualquer outro formato.
to_minutes() {
  [[ $1 =~ ^([01][0-9]|2[0-3]):([0-5][0-9])$ ]] || return 1
  echo $((10#${BASH_REMATCH[1]} * 60 + 10#${BASH_REMATCH[2]}))
}

parse_time() {
  local label=$1 value=$2
  to_minutes "$value" || die "$label deve estar no formato HH:MM (00:00 a 23:59), veio \"$value\"" 2
}

validate_config() {
  local stop start
  stop=$(parse_time GYMBRO_STOP_AT "$STOP_AT")
  start=$(parse_time GYMBRO_START_AT "$START_AT")
  (( stop != start )) || die "GYMBRO_STOP_AT e GYMBRO_START_AT não podem ser iguais ($STOP_AT)" 2
  [[ $CHECK_INTERVAL =~ ^[1-9][0-9]*$ ]] \
    || die "GYMBRO_CHECK_INTERVAL deve ser um número inteiro de segundos, veio \"$CHECK_INTERVAL\"" 2
}

current_time() {
  if [[ -n ${GYMBRO_NOW:-} ]]; then echo "$GYMBRO_NOW"; else date +%H:%M; fi
}

# A janela desligada vai de STOP_AT (incluso) até START_AT (excluso) e pode atravessar a meia-noite.
in_off_window() {
  local now=$1 stop=$2 start=$3
  if (( stop < start )); then
    (( now >= stop && now < start ))
  else
    (( now >= stop || now < start ))
  fi
}

desired_state() {
  local now stop start
  now=$(parse_time "a hora atual" "$(current_time)")
  stop=$(parse_time GYMBRO_STOP_AT "$STOP_AT")
  start=$(parse_time GYMBRO_START_AT "$START_AT")
  if in_off_window "$now" "$stop" "$start"; then echo stopped; else echo running; fi
}

compose() {
  docker compose --project-directory "$REPO_ROOT" -f "$REPO_ROOT/compose.yaml" "$@"
}

count_lines() {
  grep -c . || true
}

reconcile() {
  local desired expected running
  desired=$(desired_state)
  expected=$(compose config --services | count_lines) || { error "não consegui ler o compose.yaml"; return 1; }
  running=$(compose ps --status running --services | count_lines) || { error "não consegui consultar o Docker"; return 1; }

  if [[ $desired == stopped ]]; then
    (( running > 0 )) || return 0
    log "fora do horário (desliga às $STOP_AT, liga às $START_AT): parando $running serviço(s)"
    compose stop || { error "falha ao parar a stack"; return 1; }
    log "stack parada"
  else
    (( running < expected )) || return 0
    log "no horário: subindo a stack ($running de $expected serviço(s) rodando)"
    # --no-build: imagem que falta é erro de implantação (rode docker compose build), não algo para
    # o agendador compilar às 16:20
    compose up -d --no-build || { error "falha ao subir a stack"; return 1; }
    log "stack no ar"
  fi
}

stop_loop() {
  [[ -n $sleep_pid ]] && kill "$sleep_pid" 2>/dev/null
  log "agendador encerrado"
  exit 0
}

run_loop() {
  mkdir -p -- "$STATE_DIR"
  exec 9> "$STATE_DIR/scheduler.lock"
  flock -n 9 || die "o agendador já está em execução (trava em $STATE_DIR/scheduler.lock)" 3

  trap stop_loop TERM INT
  log "agendador iniciado: desliga às $STOP_AT, liga às $START_AT, verifica a cada ${CHECK_INTERVAL}s"
  while true; do
    reconcile || error "nova tentativa em ${CHECK_INTERVAL}s"
    # sleep em segundo plano + wait: o SIGTERM interrompe a espera na hora
    sleep "$CHECK_INTERVAL" &
    sleep_pid=$!
    wait "$sleep_pid" || true
    sleep_pid=""
  done
}

main() {
  case ${1:-} in
    run) validate_config; run_loop ;;
    once) validate_config; reconcile ;;
    desired) validate_config; desired_state ;;
    -h | --help | help) usage ;;
    *) usage >&2; exit 2 ;;
  esac
}

main "$@"

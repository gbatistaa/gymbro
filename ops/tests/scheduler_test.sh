#!/usr/bin/env bash
# Testes do ops/scheduler.sh com um `docker` falso no PATH: nada toca o Docker de verdade.
# Uso: ops/tests/scheduler_test.sh
set -Eeuo pipefail

SCRIPT_DIR=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
SCHEDULER="$SCRIPT_DIR/../scheduler.sh"

WORK_DIR=$(mktemp -d)
trap 'rm -rf -- "$WORK_DIR"' EXIT

FAKE_BIN="$WORK_DIR/bin"
mkdir -p "$FAKE_BIN"
cat > "$FAKE_BIN/docker" <<'FAKE'
#!/usr/bin/env bash
# docker falso: registra a chamada e responde conforme FAKE_SERVICES, FAKE_RUNNING e FAKE_FAIL
printf '%s\n' "$*" >> "$FAKE_DOCKER_LOG"
case " $* " in
  *" config --services "*) printf '%b' "${FAKE_SERVICES:-backend\nparser\n}" ;;
  *" ps "*) printf '%b' "${FAKE_RUNNING:-}" ;;
  *" stop"*|*" up "*) [[ -z "${FAKE_FAIL:-}" ]] || { echo "Cannot connect to the Docker daemon" >&2; exit 1; } ;;
esac
FAKE
chmod +x "$FAKE_BIN/docker"

export PATH="$FAKE_BIN:$PATH"
export FAKE_DOCKER_LOG="$WORK_DIR/docker.log"
export GYMBRO_STATE_DIR="$WORK_DIR/state"

passed=0
failed=0

pass() { passed=$((passed + 1)); printf '  ok   %s\n' "$1"; }
fail() { failed=$((failed + 1)); printf '  FAIL %s\n       %s\n' "$1" "$2"; }

reset_fake() {
  : > "$FAKE_DOCKER_LOG"
  unset FAKE_RUNNING FAKE_FAIL FAKE_SERVICES GYMBRO_STOP_AT GYMBRO_START_AT
}

assert_desired() {
  local now=$1 expected=$2 actual
  actual=$(GYMBRO_NOW="$now" "$SCHEDULER" desired)
  if [[ "$actual" == "$expected" ]]; then
    pass "às $now o estado desejado é $expected (parar ${GYMBRO_STOP_AT:-07:00}, subir ${GYMBRO_START_AT:-16:20})"
  else
    fail "às $now o estado desejado é $expected" "veio: $actual"
  fi
}

docker_calls_matching() {
  grep -cE -- "$1" "$FAKE_DOCKER_LOG" || true
}

echo "janela padrão: desligado das 07:00 às 16:20"
reset_fake
assert_desired 00:00 running
assert_desired 06:59 running
assert_desired 07:00 stopped
assert_desired 12:00 stopped
assert_desired 16:19 stopped
assert_desired 16:20 running
assert_desired 23:59 running

echo "janela que atravessa a meia-noite"
reset_fake
export GYMBRO_STOP_AT=22:00 GYMBRO_START_AT=06:00
assert_desired 21:59 running
assert_desired 22:00 stopped
assert_desired 03:00 stopped
assert_desired 05:59 stopped
assert_desired 06:00 running
unset GYMBRO_STOP_AT GYMBRO_START_AT

echo "configuração inválida"
for bad in 7:00 24:00 07:60 abc; do
  reset_fake
  if output=$(GYMBRO_STOP_AT="$bad" GYMBRO_NOW=12:00 "$SCHEDULER" desired 2>&1); then
    fail "recusa GYMBRO_STOP_AT=$bad" "aceitou e respondeu: $output"
  elif [[ "$output" == *"HH:MM"* ]]; then
    pass "recusa GYMBRO_STOP_AT=$bad com mensagem clara"
  else
    fail "recusa GYMBRO_STOP_AT=$bad com mensagem clara" "mensagem: $output"
  fi
done
reset_fake
if output=$(GYMBRO_STOP_AT=10:00 GYMBRO_START_AT=10:00 GYMBRO_NOW=12:00 "$SCHEDULER" desired 2>&1); then
  fail "recusa horário de parar igual ao de subir" "aceitou: $output"
else
  pass "recusa horário de parar igual ao de subir"
fi

echo "reconciliação (uma rodada)"
reset_fake
export FAKE_RUNNING='backend\nparser\n'
GYMBRO_NOW=12:00 "$SCHEDULER" once > /dev/null
if [[ $(docker_calls_matching ' stop$') == 1 ]]; then pass "no horário de desligar, para a stack que está rodando"
else fail "no horário de desligar, para a stack que está rodando" "$(cat "$FAKE_DOCKER_LOG")"; fi

reset_fake
GYMBRO_NOW=12:00 "$SCHEDULER" once > /dev/null
if [[ $(docker_calls_matching ' stop$| up ') == 0 ]]; then pass "no horário de desligar, não mexe na stack já parada"
else fail "no horário de desligar, não mexe na stack já parada" "$(cat "$FAKE_DOCKER_LOG")"; fi

reset_fake
GYMBRO_NOW=17:00 "$SCHEDULER" once > /dev/null
if [[ $(docker_calls_matching ' up -d ') == 1 ]]; then pass "no horário de ligar, sobe a stack parada"
else fail "no horário de ligar, sobe a stack parada" "$(cat "$FAKE_DOCKER_LOG")"; fi

reset_fake
export FAKE_RUNNING='backend\n'
GYMBRO_NOW=17:00 "$SCHEDULER" once > /dev/null
if [[ $(docker_calls_matching ' up -d ') == 1 ]]; then pass "no horário de ligar, completa a stack parcialmente parada"
else fail "no horário de ligar, completa a stack parcialmente parada" "$(cat "$FAKE_DOCKER_LOG")"; fi

reset_fake
export FAKE_RUNNING='backend\nparser\n'
GYMBRO_NOW=17:00 "$SCHEDULER" once > /dev/null
if [[ $(docker_calls_matching ' stop$| up ') == 0 ]]; then pass "no horário de ligar, não mexe na stack que já está de pé"
else fail "no horário de ligar, não mexe na stack que já está de pé" "$(cat "$FAKE_DOCKER_LOG")"; fi

reset_fake
export FAKE_RUNNING='backend\nparser\n' FAKE_FAIL=1
if output=$(GYMBRO_NOW=12:00 "$SCHEDULER" once 2>&1); then
  fail "falha do Docker vira código de saída diferente de zero" "saiu com 0: $output"
elif [[ "$output" == *"ERRO"* ]]; then
  pass "falha do Docker vira erro registrado e código de saída diferente de zero"
else
  fail "falha do Docker vira erro registrado" "saída: $output"
fi

echo "instância única"
reset_fake
GYMBRO_NOW=12:00 GYMBRO_CHECK_INTERVAL=1 "$SCHEDULER" run > "$WORK_DIR/first.log" 2>&1 &
first_pid=$!
for _ in $(seq 1 50); do
  grep -q "agendador iniciado" "$WORK_DIR/first.log" 2>/dev/null && break
  sleep 0.1
done
if output=$(GYMBRO_NOW=12:00 "$SCHEDULER" run 2>&1); then
  fail "segunda instância é recusada" "subiu: $output"
elif [[ "$output" == *"já está em execução"* ]]; then
  pass "segunda instância é recusada"
else
  fail "segunda instância é recusada com mensagem clara" "mensagem: $output"
fi
kill -TERM "$first_pid"
if wait "$first_pid"; then pass "SIGTERM encerra o laço com código 0"
else fail "SIGTERM encerra o laço com código 0" "código: $?"; fi

echo
echo "$passed passaram, $failed falharam"
[[ $failed -eq 0 ]]

# ADR 0001 — Contrato de erro da API

**Status:** aceito
**Data:** 2026-11-10

## Contexto

O `ErrorResponse` devolvia `error` preenchido com `HttpStatus.name()` ("UNAUTHORIZED",
"NOT_FOUND"), o que já está em `status` e não distingue causas diferentes do mesmo status. Um
cliente não conseguia separar "sessão já aberta" de "conflito genérico" sem parsear a mensagem, e
mesmo assim a mensagem é texto livre que pode mudar.

Além disso, erro de validação vinha com todas as mensagens concatenadas em `"; "`, sem indicar o
campo. O `docs/brand-identity.md` §9 exige que a mensagem apareça embaixo do input, o que era
impossível de implementar no cliente.

## Decisão

Um único shape para todas as respostas de erro:

```json
{
  "timestamp": "2026-11-10T10:00:00",
  "status": 409,
  "code": "SESSION_ALREADY_ACTIVE",
  "message": "An open session already exists",
  "path": "/api/sessions",
  "errors": []
}
```

- **`code`** é estável e é o que o cliente testa. `message` é texto para humano e pode mudar.
- **`errors`** é sempre um array, vazio quando o erro não é de campo. O shape não varia.
- Exceções de domínio carregam o próprio código (`ApiException.getCode()`), com default por tipo
  e override quando a causa precisa ser distinguida.
- O `error` anterior foi removido em vez de mantido ao lado de `code`: dois campos quase idênticos
  garantem que alguém acabe dependendo do errado.

## Códigos

| Código | Status |
|---|---|
| `NOT_FOUND` | 404 |
| `FORBIDDEN` | 403 |
| `UNAUTHENTICATED` | 401 |
| `BAD_REQUEST` | 400 |
| `INVALID_PARAMETER` | 400 |
| `MALFORMED_BODY` | 400 |
| `VALIDATION_FAILED` | 400 |
| `CONFLICT` | 409 |
| `SESSION_ALREADY_ACTIVE` | 409 |
| `CLIENT_LOG_CONFLICT` | 409 |
| `RESOURCE_ALREADY_EXISTS` | 409 |
| `DATA_CONFLICT` | 409 |
| `STALE_WRITE` | 409 |
| `TOO_MANY_ATTEMPTS` | 429 |
| `PAYLOAD_TOO_LARGE` | 413 |
| `UNSUPPORTED_MEDIA_TYPE` | 415 |
| `METHOD_NOT_ALLOWED` | 405 |
| `INTERNAL_ERROR` | 500 |

## Consequências

- Adicionar um código é aditivo; renomear um existente quebra cliente e exige versão.
- Todo `@ExceptionHandler` precisa passar um código — o overload sem código não existe, então é
  impossível esquecer.
- Respostas de erro ficam um pouco maiores (`errors: []` sempre presente).

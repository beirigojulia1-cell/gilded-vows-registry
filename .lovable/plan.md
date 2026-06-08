Alterações em `src/routes/index.tsx`:

1. **Horário** (linha 392): trocar `"17h00"` por `"12h00"` e remover o subtítulo "Entrada a partir das 16h30" (deixar vazio ou ajustar).
2. **Local** (linha 393): trocar endereço `"Av. das Flores, 1200 · Brasil"` por `"Av. Marginal do CSU, 1455"`. Atualizar link do mapa para apontar para esse endereço.
3. **RSVP** (função `RSVP`, linhas 434–487):
   - Remover o estado `guests` e o campo "Número de Convidados" (linhas 469–475).
   - Remover `guests` do payload salvo em `localStorage`.

Sem mudanças em backend/banco.
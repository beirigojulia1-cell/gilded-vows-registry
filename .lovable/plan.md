Trocar o card "Dress Code" por "Bebida" na seção InfoCards do site.

Mudança em `src/routes/index.tsx`:
1. Criar novo componente `DrinkIcon()` com SVG de copo/garrafa no estilo dos demais ícones (linha fina, 32x32, stroke currentColor).
2. No array `cards` da função `InfoCards`, substituir:
   `{ label: "Dress Code", value: "Esporte Fino", sub: "Tons claros e elegantes", icon: <EnvIcon /> }`
   por:
   `{ label: "Bebida", value: "Traga sua bebida", sub: "Cerveja, Refrigerante, Suco", icon: <DrinkIcon /> }`

Nenhuma outra alteração necessária.
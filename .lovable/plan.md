# RedHouse — Roblox-style bet house (demo currency)

Plataforma de apostas estilo BloxFlip, com moeda **fictícia** nesta fase (para gravação de vídeos). Nenhum Robux real, nenhum pagamento. UI em inglês.

## Fase 1 — Escopo desta entrega

### Login por verificação de bio do Roblox
Fluxo em 4 passos, sem senha:
1. Usuário digita o nick do Roblox.
2. O sistema busca o perfil (ID, nome de exibição, avatar) e mostra o card do personagem para confirmar.
3. Ao confirmar, gera 8 palavras aleatórias (código de verificação) com timer de 10 min.
4. Usuário cola as palavras na bio do Roblox e clica em **Verify**. O servidor lê a bio; se contiver o código, cria/entra na conta e emite a sessão.

Detalhes técnicos: a busca de perfil e a leitura da bio acontecem em funções de servidor (a API do Roblox bloqueia chamadas direto do navegador). A conta é criada no Lovable Cloud com um identificador derivado do ID do Roblox, e a sessão fica salva entre visitas.

### Economia
- Saldo em **RC (RedHouse Coins)**, fictício.
- Bônus inicial de 1.000 RC, faucet diário e botão de recarga demo.
- Toda aposta/pagamento é calculada **no servidor**: o cliente nunca decide o resultado nem grava o saldo.
- Histórico de apostas, estatísticas do jogador, leaderboard e feed de "big wins" ao vivo.
- Provably fair: server seed + client seed + nonce, com hash publicado e verificação após revelar.

### Jogos
Clássicos:
- **Crash** — multiplicador subindo, cash out antes de explodir, rodadas em ciclo com apostas de todos na mesma rodada.
- **Mines** — grade 5x5, número de bombas escolhido pelo jogador.
- **Roulette** — roleta de cores (red / black / gold) com rodadas cronometradas.
- **Coinflip** — 1v1 rápido contra a casa (PvP entra na fase 2).
- **Towers** — escolha de caminho seguro por andar.
- **Plinko** — bolinha caindo entre pinos, risco baixo/médio/alto.

Originais RedHouse (exclusivos, para diferenciar do BloxFlip):
- **Blackout** — grade que apaga fileiras; sobreviva a cada apagão para subir o multiplicador.
- **Heist** — abrir cofres em sequência, cada cofre paga mais e aumenta o risco de alarme.
- **Ladder** — escada de multiplicadores com escolha de risco por degrau.

### Trading (seção de gráficos)
Modo **RedHouse Markets**: gráfico de velas em tempo real de um ativo simulado (RC/USD, com movimento aleatório contínuo e volatilidade configurável).
- Posições LONG / SHORT com alavancagem 1x–100x.
- Preço de entrada, PnL ao vivo, liquidação automática, take profit e stop loss.
- Livro de posições abertas e histórico fechado.
- Preço gerado no servidor para que todos vejam o mesmo gráfico.

## Design
Direção visual escura e "premium casino", não genérica: preto profundo, vermelho carmim como cor de marca, dourado para ganhos, verde/vermelho para mercado. Tipografia condensada e técnica, números em fonte tabular, bordas finas, brilho contido em elementos vencedores, animações curtas e físicas (contadores, cash out, cartas caindo). Layout de "command center": barra superior com saldo e avatar do Roblox, grade de jogos, painel lateral de apostas ao vivo.

## Fora de escopo agora (fase 2)
- Robux real, depósito/saque, verificação de 18+ e regras legais.
- Coinflip PvP entre jogadores, chat, sistema de afiliados, rakeback e caixas.

## Ordem de construção
1. Design system + shell do site e landing.
2. Lovable Cloud: tabelas de usuários, saldo, apostas, posições, seeds; políticas de acesso.
3. Login por bio do Roblox ponta a ponta.
4. Carteira, faucet, histórico e leaderboard.
5. Jogos clássicos (Crash, Mines, Roulette, Coinflip, Towers, Plinko).
6. Jogos originais (Blackout, Heist, Ladder).
7. RedHouse Markets (trading).

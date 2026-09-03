import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useProfile } from "@/hooks/useProfile";
import { Robux } from "@/components/Robux";
import { GAME_ART } from "@/components/GameCarousel";
import { getGame, GAMES } from "@/lib/games";
import { Crash } from "@/components/games/Crash";
import { Mines } from "@/components/games/Mines";
import { Roulette } from "@/components/games/Roulette";
import { Coinflip } from "@/components/games/Coinflip";
import { Plinko } from "@/components/games/Plinko";
import { StepGame, STEP_GAMES } from "@/components/games/StepGame";
import { BetHistory } from "@/components/BetHistory";

export const Route = createFileRoute("/games/$game")({
  loader: ({ params }) => {
    const game = getGame(params.game);
    if (!game) throw notFound();
    return { game };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return { meta: [{ title: "Game unavailable — RedHouse" }, { name: "robots", content: "noindex" }] };
    }
    const { game } = loaderData;
    const title = `${game.name} — RedHouse`;
    const description = `${game.tagline}. Play ${game.name} with demo Robux on RedHouse.`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
      ],
    };
  },
  notFoundComponent: () => (
    <main className="mx-auto max-w-3xl px-4 py-24 text-center">
      <h1 className="font-display text-3xl font-bold uppercase">Game not found</h1>
      <Link to="/" className="mt-4 inline-block text-primary underline">
        Back to lobby
      </Link>
    </main>
  ),
  errorComponent: () => (
    <main className="mx-auto max-w-3xl px-4 py-24 text-center">
      <h1 className="font-display text-3xl font-bold uppercase">This table is offline</h1>
      <Link to="/" className="mt-4 inline-block text-primary underline">
        Back to lobby
      </Link>
    </main>
  ),
  component: GamePage,
});

function GamePage() {
  const { game } = Route.useLoaderData();
  const { profile } = useProfile();
  const step = STEP_GAMES[game.id];

  return (
    <main className="mx-auto max-w-7xl px-4 pb-16">
      <div className="mt-6 flex flex-wrap items-center gap-2 overflow-x-auto pb-2">
        {GAMES.map((g) => (
          <Link
            key={g.id}
            to="/games/$game"
            params={{ game: g.id }}
            className="rounded-md border border-border px-3 py-1.5 text-xs uppercase tracking-wide text-muted-foreground hover:text-foreground"
            activeProps={{ className: "border-primary/60 bg-primary/10 text-foreground" }}
          >
            {g.name}
          </Link>
        ))}
      </div>

      <header className="panel relative mb-6 mt-4 overflow-hidden">
        <img
          src={GAME_ART[game.id]}
          alt={`${game.name} artwork`}
          width={768}
          height={512}
          className="absolute inset-0 h-full w-full object-cover opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-surface-1 via-surface-1/85 to-surface-1/30" />
        <div className="relative flex flex-wrap items-end justify-between gap-4 p-5">
          <div>
            <h1 className="font-display text-4xl font-bold uppercase">{game.name}</h1>
            <p className="text-sm text-muted-foreground">{game.tagline}</p>
          </div>
          {profile && (
            <div className="panel bg-background/70 px-4 py-2">
              <span className="block text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                Balance
              </span>
              <Robux amount={profile.balance} className="text-base font-bold" />
            </div>
          )}
        </div>
      </header>


      {game.id === "crash" && <Crash />}
      {game.id === "mines" && <Mines />}
      {game.id === "roulette" && <Roulette />}
      {game.id === "coinflip" && <Coinflip />}
      {game.id === "plinko" && <Plinko />}
      {step && <StepGame config={step} />}

      <div className="mt-8">
        <BetHistory game={game.id} />
      </div>
    </main>
  );
}

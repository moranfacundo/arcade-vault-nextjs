import {
  H,
  INITIAL_ASTEROIDS,
  INITIAL_LIVES,
  MAX_DT,
  POINTS,
  POWERUP_DROP_CHANCE,
  POWERUP_DURATION,
  RESPAWN_DELAY,
  SAFE_DIST,
  W,
} from "./constants";
import { Asteroid, Bullet, Particle, PowerUp, Ship } from "./entities";
import type { GameCallbacks, GameEngine } from "../types";
import { createInput } from "./input";
import { dist, rand } from "./utils";

/** Asteroides reporta vidas y nivel: callbacks obligatorios. */
export type AsteroidsCallbacks = Required<GameCallbacks>;

export type AsteroidsGame = GameEngine;

type State = "playing" | "dead" | "gameover";

export function createAsteroids(canvas: HTMLCanvasElement, cb: AsteroidsCallbacks): AsteroidsGame {
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D no disponible");
  canvas.width = W;
  canvas.height = H;

  const input = createInput();

  let ship = new Ship();
  let bullets: Bullet[] = [];
  let asteroids: Asteroid[] = [];
  let particles: Particle[] = [];
  let powerUps: PowerUp[] = [];
  let score = 0;
  let lives = INITIAL_LIVES;
  let level = 1;
  let state: State = "playing";
  let deadTimer = 0;
  let powerUpSpawned = false;
  let killsSinceSpawn = 0;

  let paused = false;
  let ended = false;
  let rafId = 0;
  let lastTime: number | null = null;
  let destroyed = false;

  const setScore = (v: number) => {
    score = v;
    cb.onScore(score);
  };
  const setLives = (v: number) => {
    lives = v;
    cb.onLives(lives);
  };
  const setLevel = (v: number) => {
    level = v;
    cb.onLevel(level);
  };

  function spawnAsteroids(count: number) {
    for (let i = 0; i < count; i++) {
      let x: number;
      let y: number;
      do {
        x = rand(0, W);
        y = rand(0, H);
      } while (Math.hypot(x - W / 2, y - H / 2) < SAFE_DIST);
      asteroids.push(new Asteroid(x, y, 3));
    }
  }

  function initGame() {
    ship = new Ship();
    bullets = [];
    asteroids = [];
    particles = [];
    powerUps = [];
    powerUpSpawned = false;
    killsSinceSpawn = 0;
    state = "playing";
    ended = false;
    setScore(0);
    setLives(INITIAL_LIVES);
    setLevel(1);
    spawnAsteroids(INITIAL_ASTEROIDS);
  }

  function nextLevel() {
    setLevel(level + 1);
    bullets = [];
    particles = [];
    powerUps = [];
    powerUpSpawned = false;
    killsSinceSpawn = 0;
    ship.reset();
    spawnAsteroids(3 + level);
  }

  function explode(x: number, y: number, count = 8) {
    for (let i = 0; i < count; i++) particles.push(new Particle(x, y));
  }

  function gameOver() {
    if (ended) return;
    ended = true;
    state = "gameover";
    input.setEnabled(false);
    cb.onGameOver(score);
  }

  function killShip() {
    explode(ship.x, ship.y, 14);
    ship.dead = true;
    setLives(lives - 1);
    if (lives <= 0) {
      gameOver();
    } else {
      state = "dead";
      deadTimer = RESPAWN_DELAY;
    }
  }

  function updateParticles(dt: number) {
    particles.forEach((p) => p.update(dt));
    particles = particles.filter((p) => !p.dead);
  }

  function update(dt: number) {
    if (state === "gameover") {
      updateParticles(dt);
      return;
    }

    if (state === "dead") {
      deadTimer -= dt;
      updateParticles(dt);
      asteroids.forEach((a) => a.update(dt));
      if (deadTimer <= 0) {
        state = "playing";
        ship.reset();
      }
      return;
    }

    if (input.pressed("Space")) bullets.push(...ship.tryShoot());

    ship.update(dt, input);
    bullets.forEach((b) => b.update(dt));
    asteroids.forEach((a) => a.update(dt));
    particles.forEach((p) => p.update(dt));
    powerUps.forEach((p) => p.update(dt));

    bullets = bullets.filter((b) => !b.dead);
    particles = particles.filter((p) => !p.dead);
    powerUps = powerUps.filter((p) => !p.dead);

    for (const p of powerUps) {
      if (!p.dead && dist(ship, p) < ship.radius + p.radius) {
        p.dead = true;
        ship.tripleShot = POWERUP_DURATION;
      }
    }

    // Bala vs asteroide
    const newAsteroids: Asteroid[] = [];
    let gained = 0;
    for (const b of bullets) {
      for (const a of asteroids) {
        if (!a.dead && !b.dead && dist(b, a) < a.radius) {
          b.dead = true;
          a.dead = true;
          gained += POINTS[a.size];
          explode(a.x, a.y, a.size * 5);
          newAsteroids.push(...a.split());
          if (!powerUpSpawned) {
            killsSinceSpawn++;
            const guaranteed = killsSinceSpawn >= 5;
            if (guaranteed || Math.random() < POWERUP_DROP_CHANCE) {
              powerUps.push(new PowerUp(a.x, a.y));
              powerUpSpawned = true;
            }
          }
        }
      }
    }
    if (gained) setScore(score + gained);
    asteroids = asteroids.filter((a) => !a.dead).concat(newAsteroids);
    bullets = bullets.filter((b) => !b.dead);

    // Nave vs asteroide
    if (ship.invincible <= 0) {
      for (const a of asteroids) {
        if (dist(ship, a) < ship.radius + a.radius * 0.82) {
          killShip();
          break;
        }
      }
    }

    // Nivel completado
    if (state === "playing" && asteroids.length === 0) nextLevel();
  }

  function draw() {
    if (!ctx) return;
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, W, H);

    particles.forEach((p) => p.draw(ctx));
    asteroids.forEach((a) => a.draw(ctx));
    powerUps.forEach((p) => p.draw(ctx));
    bullets.forEach((b) => b.draw(ctx));
    ship.draw(ctx);

    // Único elemento de HUD que vive en el canvas: temporizador del triple disparo.
    if (ship.tripleShot > 0) {
      ctx.font = "15px monospace";
      ctx.textAlign = "left";
      ctx.textBaseline = "alphabetic";
      ctx.fillStyle = "#0ff";
      ctx.fillText(`3x  ${ship.tripleShot.toFixed(1)}s`, 14, 26);
    }
  }

  function loop(ts: number) {
    if (destroyed) return;
    const dt = lastTime === null ? 0 : Math.min((ts - lastTime) / 1000, MAX_DT);
    lastTime = ts;
    if (!paused) update(dt);
    draw();
    rafId = requestAnimationFrame(loop);
  }

  initGame();
  rafId = requestAnimationFrame(loop);

  return {
    pause() {
      if (paused || ended) return;
      paused = true;
      input.setEnabled(false);
    },
    resume() {
      if (!paused) return;
      paused = false;
      lastTime = null; // evita un dt acumulado tras la pausa
      if (!ended) input.setEnabled(true);
    },
    restart() {
      paused = false;
      lastTime = null;
      input.clear();
      input.setEnabled(true);
      initGame();
    },
    end() {
      gameOver();
    },
    destroy() {
      destroyed = true;
      cancelAnimationFrame(rafId);
      input.destroy();
    },
  };
}

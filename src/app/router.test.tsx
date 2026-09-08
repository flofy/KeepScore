import { describe, expect, it } from 'vitest';
import { createAppRouter } from './router';

function createComponents() {
  return {
    home: <div>home</div>,
    setup: <div>setup</div>,
    chwatzi: <div>chwatzi</div>,
    game: <div>game</div>,
    saved: <div>saved</div>,
  };
}

describe('application router', () => {
  it('creates a browser router from the application route contract', () => {
    const router = createAppRouter(createComponents());

    expect(router.routes.map((route) => route.path)).toEqual([
      '/',
      '/setup',
      '/chwatzi',
      '/game',
      '/saved',
    ]);
  });
});

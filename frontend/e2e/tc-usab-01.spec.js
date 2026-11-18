import { test, expect } from '@playwright/test';

test.describe('TC-USAB-01: Responsividad Multiplataforma y Jerarquía Visual de Prioridades', () => {
  let usuario;

  test.beforeEach(async ({ page }) => {
    usuario = {
      nombre: 'Usuario Usabilidad QA',
      email: `usab_${Date.now()}_${Math.random().toString(36).substring(2, 6)}@utal.cl`,
      password: 'Password123'
    };
    await page.goto('/registro');
    await page.fill('#nombre', usuario.nombre);
    await page.fill('#email', usuario.email);
    await page.fill('#password', usuario.password);
    await page.fill('#confirmar', usuario.password);
    await page.click('button[type="submit"]');

    await page.waitForURL('**/login?registrado=1');
    await page.fill('#email', usuario.email);
    await page.fill('#password', usuario.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/tableros');

    await page.click('button:has-text("Crear tablero")');
    await page.fill('#tablero-nombre', 'Tablero Usabilidad Multiplataforma');
    await page.click('button[type="submit"]:has-text("Crear tablero")');
    await page.waitForURL(/\/tableros\/[a-f0-9]{24}/);

    // Crear tareas con las tres prioridades
    for (const [titulo, prioridad] of [['Tarea Alta', 'Alta'], ['Tarea Media', 'Media'], ['Tarea Baja', 'Baja']]) {
      await page.click('button:has-text("Nueva tarea")');
      await page.fill('#tarea-titulo', titulo);
      await page.click(`label:has-text("${prioridad}")`);
      await page.click('button[type="submit"]:has-text("Crear tarea")');
      await expect(page.locator('.tarea', { hasText: titulo })).toBeVisible();
    }
  });

  test('Bloque 1: Retroalimentación Visual y Distinción de Prioridades', async ({ page }) => {
    // 1. Verificar presencia de tareas con sus respectivos indicadores
    const tareaAlta = page.locator('.tarea', { hasText: 'Tarea Alta' });
    const tareaMedia = page.locator('.tarea', { hasText: 'Tarea Media' });
    const tareaBaja = page.locator('.tarea', { hasText: 'Tarea Baja' });

    await expect(tareaAlta.locator('.prioridad')).toHaveText('Alta');
    await expect(tareaMedia.locator('.prioridad')).toHaveText('Media');
    await expect(tareaBaja.locator('.prioridad')).toHaveText('Baja');
  });

  test('Bloque 2: Responsividad en Escritorio (1920x1080), Tablet (820x1180) y Móvil (375x667)', async ({ page }) => {
    // 1. Escritorio
    await page.setViewportSize({ width: 1920, height: 1080 });
    await expect(page.locator('.columnas')).toBeVisible();
    await expect(page.locator('h1')).toBeVisible();

    // 2. Tablet
    await page.setViewportSize({ width: 820, height: 1180 });
    await expect(page.locator('.columnas')).toBeVisible();

    // 3. Móvil
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('.columnas')).toBeVisible();

    // En vista móvil, comprobar que el modal de nueva tarea se puede abrir y operar
    await page.click('button:has-text("Nueva tarea")');
    await expect(page.locator('#tarea-titulo')).toBeVisible();
    await expect(page.locator('button[type="submit"]:has-text("Crear tarea")')).toBeVisible();
    await page.click('button:has-text("Cancelar")');
  });
});

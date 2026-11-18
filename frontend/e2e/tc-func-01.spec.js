import { test, expect } from '@playwright/test';

test.describe('TC-FUNC-01: Movimiento de Tarea con Drag & Drop y Persistencia de Estado', () => {
  let usuario;

  test.beforeEach(async ({ page }) => {
    usuario = {
      nombre: 'Usuario DragDrop QA',
      email: `dragdrop_${Date.now()}_${Math.random().toString(36).substring(2, 6)}@utal.cl`,
      password: 'Password123'
    };

    // 1. Registro y Login para obtener sesión activa
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

    // 2. Crear un tablero
    await page.click('button:has-text("Crear tablero")');
    await page.fill('#tablero-nombre', 'Tablero Interactivo Drag & Drop');
    await page.click('button[type="submit"]:has-text("Crear tablero")');
    await page.waitForURL(/\/tableros\/[a-f0-9]{24}/);

    // 3. Crear una tarea en "Pendiente"
    await page.click('button:has-text("Nueva tarea")');
    await page.fill('#tarea-titulo', 'Tarjeta para Mover');
    await page.click('button[type="submit"]:has-text("Crear tarea")');

    // Esperar a que la tarjeta esté visible en Pendiente
    const columnaPendiente = page.locator('section.columna:has(h2:text("Pendiente"))');
    await expect(columnaPendiente.locator('.tarea', { hasText: 'Tarjeta para Mover' })).toBeVisible();
  });

  test('Bloque 1 y 2: Drag & Drop Happy Path y Reversión ante Desconexión de Red (RF17 - RF20)', async ({ page }) => {
    const tarjeta = page.locator('.tarea', { hasText: 'Tarjeta para Mover' });
    const columnaPendiente = page.locator('section.columna:has(h2:text("Pendiente"))');
    const columnaEnCurso = page.locator('section.columna:has(h2:text("En curso"))');
    const columnaTerminado = page.locator('section.columna:has(h2:text("Terminado"))');


    // Bloque 1: Flujo Nominal / Happy Path

    // 1 y 2. Arrastrar de "Pendiente" hacia "En curso"
    const listaEnCurso = columnaEnCurso.locator('.columna-cuerpo');
    await tarjeta.dragTo(listaEnCurso);

    // Verificar inmediatamente en la UI que ahora está en "En curso"
    await expect(columnaEnCurso.locator('.tarea', { hasText: 'Tarjeta para Mover' })).toBeVisible({ timeout: 5000 });
    await expect(columnaPendiente.locator('.tarea', { hasText: 'Tarjeta para Mover' })).not.toBeVisible();

    // 3. Recargar la página del navegador para forzar nueva petición GET al backend
    await page.reload();
    await expect(columnaEnCurso.locator('.tarea', { hasText: 'Tarjeta para Mover' })).toBeVisible();
    await expect(columnaPendiente.locator('.tarea', { hasText: 'Tarjeta para Mover' })).not.toBeVisible();


    // Bloque 2: Manejo de Excepción ante Desconexión de Red

    // 4. Desconectar la red del navegador
    await page.context().setOffline(true);

    // 5 y 6. Intentar arrastrar de "En curso" a "Terminado" estando offline
    const listaTerminado = columnaTerminado.locator('.columna-cuerpo');
    await tarjeta.dragTo(listaTerminado);

    // 7. El sistema debe revertir visualmente la tarjeta a "En curso"
    await expect(columnaEnCurso.locator('.tarea', { hasText: 'Tarjeta para Mover' })).toBeVisible({ timeout: 5000 });
    await expect(columnaTerminado.locator('.tarea', { hasText: 'Tarjeta para Mover' })).not.toBeVisible();

    // 8. Se despliega mensaje de retroalimentación de error
    const alertaNotificacion = page.locator('.toast, [role="status"], .notificaciones');
    await expect(alertaNotificacion.first()).toBeVisible({ timeout: 5000 });

    // 9. Restaurar la red
    await page.context().setOffline(false);
  });
});

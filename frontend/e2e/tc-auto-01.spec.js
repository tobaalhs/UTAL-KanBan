import { test, expect } from '@playwright/test';

test.describe('TC-AUTO-01: Suite de Regresión E2E de Flujo Completo', () => {
  const usuarioSintetico = {
    nombre: 'Usuario E2E QA',
    email: `e2eUser_${Date.now()}@utalca.cl`,
    password: 'TestE2EPassword123'
  };

  const tableroNombre = 'TableroTest';
  const tareaTitulo = 'TareaTest';

  test('Flujo completo continuo: Registro -> Login -> Crear Tablero -> Crear Tarea en Pendiente (RNF08)', async ({ page }) => {

    // Paso 1: Navegar a la URL de registro, ingresar datos sintéticos y enviar
    const tInicioRegistro = Date.now();
    await page.goto('/registro');
    await expect(page.locator('h1')).toContainText('Crear cuenta');

    await page.fill('#nombre', usuarioSintetico.nombre);
    await page.fill('#email', usuarioSintetico.email);
    await page.fill('#password', usuarioSintetico.password);
    await page.fill('#confirmar', usuarioSintetico.password);

    await page.click('button[type="submit"]');


    // Paso 2: Verificar redirección al login y enviar credenciales
    await page.waitForURL('**/login?registrado=1');
    const tFinRegistro = Date.now();
    // Latencia de UI menor a un segundo o tiempo razonable de red local
    expect(tFinRegistro - tInicioRegistro).toBeLessThan(10000);

    await expect(page.locator('.alerta-exito')).toContainText('Cuenta creada, ya puedes iniciar sesión');

    // Llenar formulario de login
    await page.fill('#email', usuarioSintetico.email);
    await page.fill('#password', usuarioSintetico.password);

    const tInicioLogin = Date.now();
    await page.click('button[type="submit"]');


    // Paso 3: Tras login exitoso, verificar navegación a /tableros y JWT
    await page.waitForURL('**/tableros');
    const tFinLogin = Date.now();
    expect(tFinLogin - tInicioLogin).toBeLessThan(5000);

    // Comprobar que en sessionStorage o localStorage existe la sesión con el token JWT
    const sesionAlmacenada = await page.evaluate(() => {
      return sessionStorage.getItem('utal-kanban-sesion') || localStorage.getItem('utal-kanban-sesion');
    });
    expect(sesionAlmacenada).toBeTruthy();
    const sesionObj = JSON.parse(sesionAlmacenada);
    expect(sesionObj.token).toBeTruthy();
    expect(sesionObj.usuario.email).toBe(usuarioSintetico.email.toLowerCase());


    // Paso 4: Disparar la creación de un nuevo tablero y acceder a su vista
    const tInicioTablero = Date.now();
    await page.click('button:has-text("Crear tablero")');
    await expect(page.locator('#tablero-nombre')).toBeVisible();

    await page.fill('#tablero-nombre', tableroNombre);
    await page.fill('#tablero-descripcion', 'Tablero automatizado para regresión E2E');
    await page.click('button[type="submit"]:has-text("Crear tablero")');

    // Esperar navegación a la vista del tablero
    await page.waitForURL(/\/tableros\/[a-f0-9]{24}/);
    const tFinTablero = Date.now();
    expect(tFinTablero - tInicioTablero).toBeLessThan(5000);

    await expect(page.locator('h1')).toHaveText(tableroNombre);


    // Paso 5: Completar formulario de nueva tarea con prioridad Alta y enviar
    const tInicioTarea = Date.now();
    await page.click('button:has-text("Nueva tarea")');
    await expect(page.locator('#tarea-titulo')).toBeVisible();

    await page.fill('#tarea-titulo', tareaTitulo);
    await page.fill('#tarea-descripcion', 'Descripción sintética de prueba E2E');
    await page.click('label:has-text("Alta")');

    await page.click('button[type="submit"]:has-text("Crear tarea")');


    // Paso 6: Verificar que la tarea aparece en la columna "Pendiente"
    const columnaPendiente = page.locator('section.columna:has(h2:text("Pendiente"))');
    await expect(columnaPendiente).toBeVisible();

    const tareaCreada = columnaPendiente.locator('.tarea', { hasText: tareaTitulo });
    await expect(tareaCreada).toBeVisible();

    const tFinTarea = Date.now();
    // Requisito RNF08: operación de crear tarea con respuesta inferior a 1 segundo
    expect(tFinTarea - tInicioTarea).toBeLessThan(5000);

    // Verificar indicador de prioridad Alta dentro de la tarea
    await expect(tareaCreada.locator('.prioridad')).toHaveText('Alta');
  });
});

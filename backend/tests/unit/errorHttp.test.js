const { crearErrorHttp, responderError } = require('../../utils/errorHttp');

describe('errorHttp utility', () => {
  it('crearErrorHttp debe asignar status y mensaje al error', () => {
    const error = crearErrorHttp(404, 'Recurso no encontrado');
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe('Recurso no encontrado');
    expect(error.status).toBe(404);
  });

  it('responderError debe enviar código de estado y JSON estandarizado', () => {
    const mockJson = jest.fn();
    const mockStatus = jest.fn().mockReturnValue({ json: mockJson });
    const res = { status: mockStatus };

    const error = crearErrorHttp(403, 'No autorizado');
    responderError(res, error);

    expect(mockStatus).toHaveBeenCalledWith(403);
    expect(mockJson).toHaveBeenCalledWith({ mensaje: 'No autorizado' });
  });

  it('responderError debe responder 500 para errores sin status', () => {
    const mockJson = jest.fn();
    const mockStatus = jest.fn().mockReturnValue({ json: mockJson });
    const res = { status: mockStatus };
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    responderError(res, new Error('Fallo imprevisto'));

    expect(mockStatus).toHaveBeenCalledWith(500);
    expect(mockJson).toHaveBeenCalledWith({ mensaje: 'Error interno del servidor' });
    consoleSpy.mockRestore();
  });
});

const expressValidator = require('express-validator');
const validarCampos = require('../../middlewares/validarCampos');

jest.mock('express-validator', () => ({
  validationResult: jest.fn()
}));

describe('Middleware: validarCampos', () => {
  const mockRespuesta = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('debe responder 400 y listar los errores si la validación falla', () => {
    const listaErrores = [
      { path: 'email', msg: 'El correo electrónico no es válido' },
      { path: 'password', msg: 'La contraseña es obligatoria' }
    ];

    expressValidator.validationResult.mockReturnValue({
      isEmpty: () => false,
      array: () => listaErrores
    });

    const req = {};
    const res = mockRespuesta();
    const next = jest.fn();

    validarCampos(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      mensaje: 'Error de validación',
      errores: listaErrores
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('debe llamar a next() si no hay errores de validación', () => {
    expressValidator.validationResult.mockReturnValue({
      isEmpty: () => true,
      array: () => []
    });

    const req = {};
    const res = mockRespuesta();
    const next = jest.fn();

    validarCampos(req, res, next);

    expect(res.status).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(1);
  });
});

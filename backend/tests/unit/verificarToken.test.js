const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const verificarToken = require('../../middlewares/verificarToken');

describe('Middleware: verificarToken', () => {
  const JWT_SECRET = process.env.JWT_SECRET || 'clave_secreta_jwt';

  const mockRespuesta = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
  };

  it('debe responder 401 si no se envía el header Authorization', () => {
    const req = { headers: {} };
    const res = mockRespuesta();
    const next = jest.fn();

    verificarToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ mensaje: 'Token de autenticación requerido' });
    expect(next).not.toHaveBeenCalled();
  });

  it('debe responder 401 si el esquema no es Bearer', () => {
    const req = { headers: { authorization: 'Basic 123456' } };
    const res = mockRespuesta();
    const next = jest.fn();

    verificarToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ mensaje: 'Token de autenticación requerido' });
    expect(next).not.toHaveBeenCalled();
  });

  it('debe responder 401 si solo se envía la palabra Bearer sin token', () => {
    const req = { headers: { authorization: 'Bearer' } };
    const res = mockRespuesta();
    const next = jest.fn();

    verificarToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ mensaje: 'Token de autenticación requerido' });
    expect(next).not.toHaveBeenCalled();
  });

  it('debe responder 401 si el token está firmado con otra clave', () => {
    const tokenInvalido = jwt.sign({ id: new mongoose.Types.ObjectId().toString() }, 'clave_falsa');
    const req = { headers: { authorization: `Bearer ${tokenInvalido}` } };
    const res = mockRespuesta();
    const next = jest.fn();

    verificarToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ mensaje: 'Token de autenticación inválido o expirado' });
    expect(next).not.toHaveBeenCalled();
  });

  it('debe responder 401 si el token está expirado', () => {
    const tokenExpirado = jwt.sign(
      { id: new mongoose.Types.ObjectId().toString() },
      JWT_SECRET,
      { expiresIn: '-1s' }
    );
    const req = { headers: { authorization: `Bearer ${tokenExpirado}` } };
    const res = mockRespuesta();
    const next = jest.fn();

    verificarToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ mensaje: 'Token de autenticación inválido o expirado' });
    expect(next).not.toHaveBeenCalled();
  });

  it('debe responder 401 si el payload no contiene un ObjectId de Mongoose válido', () => {
    const tokenSinIdValido = jwt.sign(
      { id: 'id-invalido-123', email: 'test@utal.cl' },
      JWT_SECRET
    );
    const req = { headers: { authorization: `Bearer ${tokenSinIdValido}` } };
    const res = mockRespuesta();
    const next = jest.fn();

    verificarToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ mensaje: 'Token de autenticación inválido' });
    expect(next).not.toHaveBeenCalled();
  });

  it('debe invocar next() y asignar req.user cuando el token es válido', () => {
    const idValido = new mongoose.Types.ObjectId().toString();
    const tokenValido = jwt.sign(
      { id: idValido, email: 'usuario@utal.cl' },
      JWT_SECRET
    );
    const req = { headers: { authorization: `Bearer ${tokenValido}` } };
    const res = mockRespuesta();
    const next = jest.fn();

    verificarToken(req, res, next);

    expect(res.status).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(1);
    expect(req.user).toEqual({
      id: idValido,
      email: 'usuario@utal.cl'
    });
  });
});

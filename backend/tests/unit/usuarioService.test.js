const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../../models/usuario.models');
const { registrarUsuario, loginUsuario } = require('../../services/usuario.service');

jest.mock('../../models/usuario.models');
jest.mock('bcrypt');

describe('Servicio: usuario.service', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('registrarUsuario', () => {
    it('debe lanzar error 409 si el correo ya está registrado', async () => {
      User.findOne.mockResolvedValue({ _id: 'u-1', email: 'existente@utal.cl' });

      await expect(
        registrarUsuario('Juan', 'EXISTENTE@utal.cl', '123456')
      ).rejects.toMatchObject({
        status: 409,
        message: 'El correo electrónico ya está registrado'
      });

      expect(User.findOne).toHaveBeenCalledWith({ email: 'existente@utal.cl' });
      expect(bcrypt.hash).not.toHaveBeenCalled();
    });

    it('debe hashear la contraseña con salt rounds 10 y guardar el usuario', async () => {
      User.findOne.mockResolvedValue(null);
      bcrypt.hash.mockResolvedValue('$2b$10$hashedpasswordstring');

      const mockSave = jest.fn().mockResolvedValue({
        _id: new mongoose.Types.ObjectId(),
        nombre: 'Nuevo Usuario',
        email: 'nuevo@utal.cl',
        password: '$2b$10$hashedpasswordstring'
      });

      User.mockImplementation(function (data) {
        this.nombre = data.nombre;
        this.email = data.email;
        this.password = data.password;
        this.save = mockSave;
      });

      const resultado = await registrarUsuario(' Nuevo Usuario ', '  NUEVO@utal.cl  ', 'pass123');

      expect(bcrypt.hash).toHaveBeenCalledWith('pass123', 10);
      expect(mockSave).toHaveBeenCalledTimes(1);
      expect(resultado.email).toBe('nuevo@utal.cl');
    });
  });

  describe('loginUsuario', () => {
    it('debe lanzar error 401 si el usuario no existe', async () => {
      User.findOne.mockResolvedValue(null);

      await expect(
        loginUsuario('noexiste@utal.cl', 'password123')
      ).rejects.toMatchObject({
        status: 401,
        message: 'Credenciales inválidas'
      });
    });

    it('debe lanzar error 401 si la contraseña es incorrecta', async () => {
      User.findOne.mockResolvedValue({
        _id: new mongoose.Types.ObjectId(),
        email: 'usuario@utal.cl',
        password: '$2b$10$hashedpassword'
      });
      bcrypt.compare.mockResolvedValue(false);

      await expect(
        loginUsuario('usuario@utal.cl', 'passwordIncorrecta')
      ).rejects.toMatchObject({
        status: 401,
        message: 'Credenciales inválidas'
      });

      expect(bcrypt.compare).toHaveBeenCalledWith('passwordIncorrecta', '$2b$10$hashedpassword');
    });

    it('debe retornar el usuario y un token JWT válido de 24h si las credenciales son correctas', async () => {
      const usuarioId = new mongoose.Types.ObjectId();
      const mockUser = {
        _id: usuarioId,
        nombre: 'Usuario Test',
        email: 'usuario@utal.cl',
        password: '$2b$10$hashedpassword'
      };

      User.findOne.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(true);

      const resultado = await loginUsuario('usuario@utal.cl', 'passwordCorrecta');

      expect(resultado.usuario).toEqual(mockUser);
      expect(typeof resultado.token).toBe('string');

      const payload = jwt.decode(resultado.token);
      expect(payload.id).toBe(usuarioId.toString());
      expect(payload.email).toBe('usuario@utal.cl');
    });
  });
});

import bcrypt from 'bcrypt';
import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { JWT_ALGORITMO, JWT_EXPIRES_IN, JWT_SECRET } from '../config/jwt.js';
import { autenticar } from '../middlewares/autenticar.js';
import { ErroHttp } from '../middlewares/erros.js';
import { limiteLogin } from '../middlewares/limiteLogin.js';
import { validarCadastro } from '../middlewares/validarCadastro.js';
import { validarLogin } from '../middlewares/validarLogin.js';
import { buscarConflitos, buscarPorEmail, buscarPorId, criarUsuarioComPadroes } from '../models/usuario.js';

const router = Router();

//POST /api/auth/cadastro
router.post('/cadastro', validarCadastro, async (req, res) => {
    const { nome, email, cpf, senha } = req.body;

    const senhaHash = await bcrypt.hash(senha, 10);

    try {
        const usuario = await criarUsuarioComPadroes({ nome, email, cpf, senhaHash });
        return res.status(201).json(usuario);
    } catch (erro) {
        if (erro.code === '23505' && erro.constraint?.startsWith('usuarios_')) {
            const conflitos = await buscarConflitos(email, cpf);
            const campos = {};
            if (conflitos.email || erro.constraint === 'usuarios_email_unico') {
                campos.email = 'Já existe um usuário com este e-mail.';
            }
            if (conflitos.cpf || erro.constraint === 'usuarios_cpf_unico') {
                campos.cpf = 'Já existe um usuário com este CPF.';
            }
            throw new ErroHttp(409, 'Usuário já cadastrado.', campos);
        }
        throw erro;
    }
});

// POST /api/auth/login
router.post('/login', limiteLogin, validarLogin, async (req, res) => {
    const { email, senha } = req.body;

    const usuario = await buscarPorEmail(email);

    const senhaConfere = await bcrypt.compare(senha, usuario?.senha_hash ?? HASH_FALSO);

    if (!usuario || !senhaConfere) {
        throw new ErroHttp(401, 'E-mail ou senha inválidos.');
    }

    const token = jwt.sign({}, JWT_SECRET, {
        subject: String(usuario.id),
        expiresIn: JWT_EXPIRES_IN,
        algorithm: JWT_ALGORITMO,
    });

    return res.json({
        token,
        usuario: { id: usuario.id, nome: usuario.nome, email: usuario.email },
    });
});

// GET /api/auth/me
router.get('/me', autenticar, async (req, res) => {
    const usuario = await buscarPorId(req.usuarioId);

    if (!usuario) {
        throw new ErroHttp(401, 'Usuário não encontrado.');
    }

    return res.json(usuario);
});

export default router;
import bcrypt from 'bcrypt';
import { Router } from 'express';
import { ErroHttp } from '../middlewares/erros.js';
import { validarCadastro } from '../middlewares/validarCadastro.js';
import { buscarConflitos, criarUsuarioComPadroes } from '../models/usuario.js';

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

export default router;
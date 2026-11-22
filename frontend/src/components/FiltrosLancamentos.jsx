import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import { categoriasDoTipo, nomeDaCategoria } from '../utils/lancamentos.js';

export default function FiltrosLancamentos({ filtros, erros, categorias, fontes, onChange, onLimpar }) {
    const opcoesDeCategoria = categoriasDoTipo(categorias, filtros.tipo);

    function alterar(campo, valor) {
        const novos = { ...filtros, [campo]: valor };
        if (campo === 'tipo' && valor && novos.categoriaId) {
            const categoria = categorias.find((item) => item.id === novos.categoriaId);
            if (categoria?.tipo !== valor) {
                novos.categoriaId = '';
            }
        }
        onChange(novos);
    }

    return (
        <Box
            sx={{
                display: 'grid',
                gap: 2,
                gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(5, minmax(0, 1fr)) auto' },
                alignItems: 'start',
            }}
        >
            <TextField
                label="De"
                type="date"
                size="small"
                value={filtros.inicio}
                onChange={(evento) => alterar('inicio', evento.target.value)}
                error={Boolean(erros.inicio)}
                helperText={erros.inicio || ' '}
                slotProps={{ inputLabel: { shrink: true } }}
            />
            <TextField
                label="Até"
                type="date"
                size="small"
                value={filtros.fim}
                onChange={(evento) => alterar('fim', evento.target.value)}
                error={Boolean(erros.fim)}
                helperText={erros.fim || ' '}
                slotProps={{ inputLabel: { shrink: true } }}
            />
            <TextField
                select
                label="Tipo"
                size="small"
                value={filtros.tipo}
                onChange={(evento) => alterar('tipo', evento.target.value)}
                helperText=" "
            >
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value="entrada">Entradas</MenuItem>
                <MenuItem value="saida">Saídas</MenuItem>
            </TextField>
            <TextField
                select
                label="Categoria"
                size="small"
                value={filtros.categoriaId}
                onChange={(evento) => alterar('categoriaId', evento.target.value)}
                disabled={categorias.length === 0}
                helperText=" "
            >
                <MenuItem value="">Todas</MenuItem>
                {opcoesDeCategoria.map((categoria) => (
                    <MenuItem key={categoria.id} value={categoria.id}>
                        {nomeDaCategoria(categoria, !filtros.tipo)}
                    </MenuItem>
                ))}
            </TextField>
            <TextField
                select
                label="Fonte/destino"
                size="small"
                value={filtros.fonteDestinoId}
                onChange={(evento) => alterar('fonteDestinoId', evento.target.value)}
                disabled={fontes.length === 0}
                helperText=" "
            >
                <MenuItem value="">Todas</MenuItem>
                {fontes.map((fonte) => (
                    <MenuItem key={fonte.id} value={fonte.id}>
                        {fonte.nome}
                    </MenuItem>
                ))}
            </TextField>
            <Button variant="outlined" onClick={onLimpar} sx={{ height: 40 }}>
                Mês atual
            </Button>
        </Box>
    );
}
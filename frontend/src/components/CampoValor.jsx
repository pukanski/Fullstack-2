import InputAdornment from '@mui/material/InputAdornment';
import TextField from '@mui/material/TextField';
import { mascararValor } from '../utils/formatacao.js';

export default function CampoValor({ name, onChange, ...props }) {
    function alterar(evento) {
        onChange?.({ target: { name, value: mascararValor(evento.target.value) } });
    }

    return (
        <TextField
            {...props}
            name={name}
            onChange={alterar}
            placeholder="0,00"
            slotProps={{
                input: {
                    startAdornment: <InputAdornment position="start">R$</InputAdornment>,
                },
                htmlInput: { inputMode: 'numeric' },
            }}
        />
    );
}
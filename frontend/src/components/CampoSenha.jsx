import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import TextField from '@mui/material/TextField';
import { useState } from 'react';

export default function CampoSenha(props) {
    const [visivel, setVisivel] = useState(false);

    return (
        <TextField
            {...props}
            type={visivel ? 'text' : 'password'}
            slotProps={{
                input: {
                    endAdornment: (
                        <InputAdornment position="end">
                            <IconButton
                                aria-label={visivel ? 'Ocultar senha' : 'Mostrar senha'}
                                onClick={() => setVisivel((atual) => !atual)}
                                onMouseDown={(evento) => evento.preventDefault()}
                                edge="end"
                            >
                                {visivel ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                        </InputAdornment>
                    ),
                },
            }}
        />
    );
}
import { createTheme } from '@mui/material/styles';

/** Dark, data-dense theme suited to a trading dashboard. */
export const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#4f9cff' },
    success: { main: '#2ecc71' }, // positive gamma / calls
    error: { main: '#ff5c5c' },   // negative gamma / puts
    background: { default: '#0e1117', paper: '#161b22' },
  },
  shape: { borderRadius: 10 },
  typography: {
    fontFamily: 'Inter, system-ui, Segoe UI, Roboto, sans-serif',
    h1: { fontSize: '1.6rem', fontWeight: 700 },
  },
});

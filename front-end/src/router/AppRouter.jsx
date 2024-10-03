// routes.js
import { useRoutes, Navigate } from 'react-router-dom';
import {ProtectedRoute} from './ProtectedRoute';
import {LoginRoute} from './LoginRoute';
import { Login } from '../pages/login/LoginPage';
import { HomePage } from '../pages/home/Homepage';
import { FormElementos } from '@/pages/Elementos/FormElementos';
import { FormRoles } from '@/pages/Roles/FormRoles';
import { FormClientes } from '@/pages/Clientes/FormClientes';
import PrestamosActivos from '@/pages/Prestamos/PrestamosActivos';
import ListaElementos from '@/pages/Prestamos/ListaElementos';
import { FormAreas } from '@/pages/Areas/FormAreas';
import { FormAdmin } from '@/pages/Administradores/FormAdmin';
import { FormCrearConsumo } from '../pages/Consumos/FormCrearConsumo.jsx';
import { FormAgregarEditarConsumo } from '../pages/Consumos/FormAgregegarEditar.jsx';
import { FormAgregarEditarPrestamo } from '../pages/Prestamos/FormAgregarEditar.jsx';
import Consumos from '@/pages/Consumos/HistorialConsumos';
import ElementosList from '@/pages/Elementos/ListaElementos';
import Clientes from '@/pages/Clientes/ListaClientes';
import Admin from '@/pages/Administradores/ListaAdmin';
import Roles from '@/pages/Roles/ListaRoles';
import HistorialPrestamos from '@/pages/Prestamos/HistorialPrestamos';
import Moras from '@/pages/Moras/ListaMoras';
import HistorialMoras from '@/pages/Moras/HistorialMoras';
import Danos from '@/pages/Daños/ListaDanos';
import HistorialDanos from '@/pages/Daños/HistorialDanos';
import HistorialTodo from '@/pages/Historial/HistorialTodo';
import Areas from '@/pages/Areas/ListaAreas';

export const AppRoutes = ({tokenSession}) => {
    return useRoutes([
        { 
            path: '/', 
            element: (
                <LoginRoute>
                    <Login /> 
                </LoginRoute>
            )
        },
        { 
            path: '/login', 
            element: (
                <LoginRoute>
                    <Login /> 
                </LoginRoute>
            )
        },
        {
            path: '/inicio',
            element: (
                <ProtectedRoute>
                    <HomePage />
                </ProtectedRoute>
            ),
        },
        {
            path: '/elementos/formulario',
            element: (
                <ProtectedRoute>
                    <FormElementos />
                </ProtectedRoute>
            ),
        },
        {
            path: '/elementos/lista',
            element: (
                <ProtectedRoute>
                    <ElementosList />
                </ProtectedRoute>
            ),
        },
        {
            path: '/roles/formulario',
            element: (
                <ProtectedRoute>
                    <FormRoles />
                </ProtectedRoute>
            ),
        },
        {
            path: '/roles/lista',
            element: (
                <ProtectedRoute>
                    <Roles />
                </ProtectedRoute>
            ),
        },
        {
            path: '/usuarios/formulario',
            element: (
                <ProtectedRoute>
                    <FormClientes />
                </ProtectedRoute>
            ),
        },
        {
            path: '/usuarios/lista',
            element: (
                <ProtectedRoute>
                    <Clientes />
                </ProtectedRoute>
            ),
        },
        {
            path: '/prestamos/lista',
            element: (
                <ProtectedRoute>
                    <PrestamosActivos />
                </ProtectedRoute>
            ),
        },
        {
            path: '/prestamos/lista2',
            element: (
                <ProtectedRoute>
                    <ListaElementos />
                </ProtectedRoute>
            ),
        },
        {
            path: '/areas/formulario',
            element: (
                <ProtectedRoute>
                    <FormAreas />
                </ProtectedRoute>
            ),
        },
        {
            path: '/areas/lista',
            element: (
                <ProtectedRoute>
                    <Areas />
                </ProtectedRoute>
            ),
        },
        {
            path: '/administrador/formulario',
            element: (
                <ProtectedRoute>
                    <FormAdmin />
                </ProtectedRoute>
            ),
        },
        {
            path: '/administrador/lista',
            element: (
                <ProtectedRoute>
                    <Admin />
                </ProtectedRoute>
            ),
        },
        {
            path: '/consumos',
            element: (
                <ProtectedRoute>
                    <FormCrearConsumo/>
                </ProtectedRoute>
            )
        },
        {
            path: '/consumos/elementos/:idconsumo',
            element: (
                <ProtectedRoute>
                    <FormAgregarEditarConsumo/>
                </ProtectedRoute>
            )
        },
        {
            path: '/prestamos/elementos/:idprestamo',
            element: (
                <ProtectedRoute>
                    <FormAgregarEditarPrestamo/>
                </ProtectedRoute>
            )
        },
        {
            path: '/prestamos/historial',
            element: (
                <ProtectedRoute>
                    <HistorialPrestamos/>
                </ProtectedRoute>
            )
        },
        {
            path: '/consumos/historial',
            element: (
                <ProtectedRoute>
                    <Consumos/>
                </ProtectedRoute>
            )
        },
        {
            path: '/moras',
            element: (
                <ProtectedRoute>
                    <Moras/>
                </ProtectedRoute>
            )
        },
        {
            path: '/moras/historial',
            element: (
                <ProtectedRoute>
                    <HistorialMoras/>
                </ProtectedRoute>
            )
        },
        {
            path: '/danos',
            element: (
                <ProtectedRoute>
                    <Danos/>
                </ProtectedRoute>
            )
        },
        {
            path: '/danos/historial',
            element: (
                <ProtectedRoute>
                    <HistorialDanos/>
                </ProtectedRoute>
            )
        },
        {
            path: '/historial',
            element: (
                <ProtectedRoute>
                    <HistorialTodo/>
                </ProtectedRoute>
            )
        },
        {
            path: '*',  
            element: <Navigate to={tokenSession ? "/inicio" : "/login"} replace />
        }
    ]);
};

export const routeLogin = () => {
    return useRoutes([
        
    ]);
}


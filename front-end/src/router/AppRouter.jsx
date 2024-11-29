// routes.js
import { useRoutes, Navigate } from 'react-router-dom';
import {ProtectedRoute} from './ProtectedRoute';
import AccessDenied from './AccessDenied';
import {LoginRoute} from './LoginRoute';
import { Login } from '../pages/login/LoginPage';
import { HomePage } from '../pages/home/Homepage';
import { FormElementos } from '@/pages/Elementos/FormElementos';
import { FormRoles } from '@/pages/Roles/FormRoles';
import { FormClientes } from '@/pages/Clientes/FormClientes';
import PrestamosActivos from '@/pages/Prestamos/PrestamosActivos';
import { FormAreas } from '@/pages/Areas/FormAreas';
import { FormAdmin } from '@/pages/Administradores/FormAdmin';
import { FormCrearConsumo } from '../pages/Consumos/FormCrearConsumo.jsx';
import { FormAgregarEditarConsumo } from '../pages/Consumos/FormAgregegarEditar.jsx';
import { FormAgregarEditarPrestamo } from '../pages/Prestamos/FormAgregarEditar.jsx';
import Consumos from '@/pages/Consumos/ListaConsumos';
import HistorialConsumos from '@/pages/Consumos/HistorialConsumos';
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
import HistorialPrestamosEs from '@/pages/Prestamos_Esp/HistorialPrestamosEs';
import Areas from '@/pages/Areas/ListaAreas';
import { FormCrearReintegro } from '@/pages/Reintegros/FormCrearReintegro';
import Reintegros from '@/pages/Reintegros/ListaReintegros';
import Traspasos from '@/pages/Traspasos/ListaTraspasos';
import { FormCrearTraspaso } from '@/pages/Traspasos/FormCrearTraspaso';
import { FormRegistrarPrestamo_Es} from '../pages/Prestamos_Esp/FormRegistrarPrestamo_Es';
import { FormElegirArea } from '@/pages/Encargos/FormElegirArea';
import { FormCrearEncargo } from '@/pages/Encargos/FormCrearEncargo';
import { Encargo } from '@/pages/Encargos/Encargo';
import PrestamosEs from '@/pages/Prestamos_Esp/ListaPrestamosEs';
import DetallePrestamoEs from '@/pages/Prestamos_Esp/DetallePrestamoEs';
import ListaEncargosCliente from '@/pages/Encargos/ListaEncargosCliente';
import ListaEncargosAdmin from '@/pages/Encargos/ListaEncargosAdmin';
import HistorialEncargos from '@/pages/Encargos/HistorialEncargos';
import HistorialTraspasos from '@/pages/Traspasos/HistorialTraspasos';
import HistorialReintegros from '@/pages/Reintegros/HistorialReintegros';
import OlvidarContrasena from '@/pages/OlvidarContrasena/OlvidarContrasena';
import NuevaContrasena from '@/pages/OlvidarContrasena/NuevaContrasena';
import PerfilCliente from '@/pages/Perfiles/PerfilCliente';
import PerfilAdmin from '@/pages/Perfiles/PerfilAdmin';

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
                <ProtectedRoute allowedRoles={['admin', 'contratista', 'practicante']}>
                    <HomePage />
                </ProtectedRoute>
            ),
        },
        {
            path: '/elementos/formulario',
            element: (
                <ProtectedRoute allowedRoles={['admin', 'contratista', 'practicante']}>
                    <FormElementos />
                </ProtectedRoute>
            ),
        },
        {
            path: '/elementos/lista',
            element: (
                <ProtectedRoute allowedRoles={['admin', 'contratista', 'practicante']}>
                    <ElementosList />
                </ProtectedRoute>
            ),
        },
        {
            path: '/roles/formulario',
            element: (
                <ProtectedRoute allowedRoles={['admin', 'contratista', 'practicante']}>
                    <FormRoles />
                </ProtectedRoute>
            ),
        },
        {
            path: '/roles/lista',
            element: (
                <ProtectedRoute allowedRoles={['admin', 'contratista', 'practicante']}>
                    <Roles />
                </ProtectedRoute>
            ),
        },
        {
            path: '/usuarios/formulario',
            element: (
                <ProtectedRoute allowedRoles={['admin', 'contratista', 'practicante']}>
                    <FormClientes />
                </ProtectedRoute>
            ),
        },
        {
            path: '/usuarios/lista',
            element: (
                <ProtectedRoute allowedRoles={['admin', 'contratista', 'practicante']}>
                    <Clientes />
                </ProtectedRoute>
            ),
        },
        {
            path: '/prestamos/lista',
            element: (
                <ProtectedRoute allowedRoles={['admin', 'contratista', 'practicante']}>
                    <PrestamosActivos/>
                </ProtectedRoute>
            ),
        },
        {
            path: '/areas/formulario',
            element: (
                <ProtectedRoute allowedRoles={['supervisor']}>
                    <FormAreas />
                </ProtectedRoute>
            ),
        },
        {
            path: '/areas/lista',
            element: (
                <ProtectedRoute allowedRoles={['supervisor']}>
                    <Areas />
                </ProtectedRoute>
            ),
        },
        {
            path: '/administrador/formulario',
            element: (
                <ProtectedRoute allowedRoles={['admin', 'supervisor']}>
                    <FormAdmin />
                </ProtectedRoute>
            ),
        },
        {
            path: '/administrador/lista',
            element: (
                <ProtectedRoute allowedRoles={['admin', 'supervisor']}>
                    <Admin />
                </ProtectedRoute>
            ),
        },
        {
            path: '/consumos',
            element: (
                <ProtectedRoute allowedRoles={['admin', 'contratista', 'practicante']}>
                    <FormCrearConsumo/>
                </ProtectedRoute>
            )
        },
        {
            path: '/consumos/elementos/:idconsumo',
            element: (
                <ProtectedRoute allowedRoles={['admin', 'contratista', 'practicante']}>
                    <FormAgregarEditarConsumo/>
                </ProtectedRoute>
            )
        },
        {
            path: '/consumos/lista',
            element: (
                <ProtectedRoute allowedRoles={['admin', 'contratista', 'practicante']}>
                    <Consumos/>
                </ProtectedRoute>
            )
        },
        {
            path: '/consumos/historial',
            element: (
                <ProtectedRoute allowedRoles={['admin', 'contratista', 'practicante']}>
                    <HistorialConsumos/>
                </ProtectedRoute>
            )
        },
        {
            path: '/prestamos/elementos/:idprestamo',
            element: (
                <ProtectedRoute allowedRoles={['admin', 'contratista', 'practicante']}>
                    <FormAgregarEditarPrestamo/>
                </ProtectedRoute>
            )
        },
        {
            path: '/prestamos/historial',
            element: (
                <ProtectedRoute allowedRoles={['admin', 'contratista', 'practicante']}>
                    <HistorialPrestamos/>
                </ProtectedRoute>
            )
        },
        {
            path: '/prestamos_esp',
            element: (
                <ProtectedRoute allowedRoles={['admin', 'contratista', 'practicante']}>
                    <FormRegistrarPrestamo_Es/>
                </ProtectedRoute>
            )
        },
        {
            path: '/prestamos_esp/lista',
            element: (
                <ProtectedRoute allowedRoles={['admin', 'contratista', 'practicante']}>
                    <PrestamosEs/>
                </ProtectedRoute>
            )
        },
        {
            path: '/prestamosEs/:idprestamo/detalle',
            element: (
                <ProtectedRoute allowedRoles={['admin', 'contratista', 'practicante']}>
                    <DetallePrestamoEs/>
                </ProtectedRoute>
            )
        },
        {
            path: '/prestamos_esp/historial',
            element: (
                <ProtectedRoute allowedRoles={['admin', 'contratista', 'practicante']}>
                    <HistorialPrestamosEs/>
                </ProtectedRoute>
            )
        },
        {
            path: '/moras',
            element: (
                <ProtectedRoute allowedRoles={['admin', 'contratista', 'practicante']}>
                    <Moras/>
                </ProtectedRoute>
            )
        },
        {
            path: '/moras/historial',
            element: (
                <ProtectedRoute allowedRoles={['admin', 'contratista', 'practicante']}>
                    <HistorialMoras/>
                </ProtectedRoute>
            )
        },
        {
            path: '/danos',
            element: (
                <ProtectedRoute allowedRoles={['admin', 'contratista', 'practicante']}>
                    <Danos/>
                </ProtectedRoute>
            )
        },
        {
            path: '/danos/historial',
            element: (
                <ProtectedRoute allowedRoles={['admin', 'contratista', 'practicante']}>
                    <HistorialDanos/>
                </ProtectedRoute>
            )
        },
        {
            path: '/historial',
            element: (
                <ProtectedRoute allowedRoles={['admin', 'contratista', 'practicante']}>
                    <HistorialTodo/>
                </ProtectedRoute>
            )
        },
        {
            path: '/reintegros',
            element: (
                <ProtectedRoute allowedRoles={['admin', 'contratista', 'practicante']}>
                    <FormCrearReintegro/>
                </ProtectedRoute>
            )
        },
        {
            path: '/reintegros/lista',
            element: (
                <ProtectedRoute allowedRoles={['admin', 'contratista', 'practicante']}>
                    <Reintegros/>
                </ProtectedRoute>
            )
        },
        {
            path: '/reintegros/historial',
            element: (
                <ProtectedRoute allowedRoles={['admin', 'contratista', 'practicante']}>
                    <HistorialReintegros/>
                </ProtectedRoute>
            )
        },
        {
            path: '/traspasos',
            element: (
                <ProtectedRoute allowedRoles={['admin', 'contratista', 'practicante']}>
                    <FormCrearTraspaso/>
                </ProtectedRoute>
            )
        },
        {
            path: '/traspasos/lista',
            element: (
                <ProtectedRoute allowedRoles={['admin', 'contratista', 'practicante']}>
                    <Traspasos/>
                </ProtectedRoute>
            )
        },
        {
            path: '/traspasos/historial',
            element: (
                <ProtectedRoute allowedRoles={['admin', 'contratista', 'practicante']}>
                    <HistorialTraspasos/>
                </ProtectedRoute>
            )
        },
        {
            path: '/encargos/elegirarea',
            element: (
                <ProtectedRoute allowedRoles={['instructor']}>
                    <FormElegirArea/>
                </ProtectedRoute>
            )
        },
        {
            path: '/encargos/elementos/:idarea/:idencargo',
            element: (
                <ProtectedRoute allowedRoles={['instructor']}>
                    <FormCrearEncargo/>
                </ProtectedRoute>
            )
        },
        {
            path: '/encargos/lista',
            element: (
                <ProtectedRoute allowedRoles={['instructor']}>
                    <ListaEncargosCliente/>
                </ProtectedRoute>
            )
        },
        {
            path: '/encargos',
            element: (
                <ProtectedRoute allowedRoles={['admin', 'contratista', 'practicante']}>
                    <ListaEncargosAdmin/>
                </ProtectedRoute>
            )
        },
        {
            path: '/encargos/persona/:idencargo',
            element: (
                <ProtectedRoute allowedRoles={['admin', 'contratista', 'practicante']}>
                    <Encargo/>
                </ProtectedRoute>
            )
        },
        {
            path: '/encargos/historial',
            element: (
                <ProtectedRoute allowedRoles={['admin', 'contratista', 'practicante']}>
                    <HistorialEncargos/>
                </ProtectedRoute>
            )
        },
        {
            path: '/olvidar-contrasena',
            element: (
                <OlvidarContrasena/>
            )
        },
        {
            path: '/restablecer-contrasena/:token',
            element: (
                <NuevaContrasena/>
            )
        },
        {
            path: '/perfil-cliente',
            element: (
                <ProtectedRoute allowedRoles={['instructor']}>
                    <PerfilCliente/>
                </ProtectedRoute>
            )
        },
        {
            path: '/perfil-Admin',
            element: (
                <ProtectedRoute allowedRoles={['admin', 'contratista', 'practicante', 'supervisor']}>
                    <PerfilAdmin/>
                </ProtectedRoute>
            )
        },
        {
            path: '/access-denied',
            element: <AccessDenied />,
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


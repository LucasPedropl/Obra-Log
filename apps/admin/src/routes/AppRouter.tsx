import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'; 
import AdminLogin from '../pages/admin/AdminLogin'; 
import AdminDashboard from '../pages/admin/AdminDashboard'; 
import EmpresasAdmin from '../pages/admin/EmpresasAdmin'; 
import InfraestruturaAdmin from '../pages/admin/InfraestruturaAdmin'; 
import ConfiguracoesAdmin from '../pages/admin/ConfiguracoesAdmin'; 
import NotFoundAdmin from '../pages/admin/NotFoundAdmin'; 
 
const router = createBrowserRouter([ 
  { path: '/', element: <Navigate to="/admin/login" replace /> }, 
  { path: '/admin/login', element: <AdminLogin /> }, 
  { path: '/admin/dashboard', element: <AdminDashboard /> }, 
  { path: '/admin/empresas', element: <EmpresasAdmin /> }, 
  { path: '/admin/infraestrutura', element: <InfraestruturaAdmin /> }, 
  { path: '/admin/configuracoes', element: <ConfiguracoesAdmin /> }, 
  { path: '/admin/*', element: <NotFoundAdmin /> }, 
  { path: '*', element: <NotFoundAdmin /> }, 
]); 
 
export const AppRouter = () => <RouterProvider router={router} />; 

import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import LandingPage from '../pages/LandingPage';
import AdminLogin from '../pages/admin/AdminLogin';
import AdminDashboard from '../pages/admin/AdminDashboard';
import ObraLogLogin from '../pages/obralog/ObraLogLogin';
import ObraLogDashboard from '../pages/obralog/ObraLogDashboard';
import SetupProfile from '../pages/obralog/SetupProfile';
import SelectCompany from '../pages/obralog/SelectCompany';
import NovaObra from '../pages/obralog/NovaObra';
import ListagemObras from '../pages/obralog/ListagemObras';
import Configuracoes from '../pages/obralog/Configuracoes';

const router = createBrowserRouter([
  {
    path: '/',
    element: <LandingPage />,
  },
  // ROTAS SUPER-ADMIN (SaaS)
  {
    path: '/admin/login',
    element: <AdminLogin />,
  },
  {
    path: '/admin/dashboard',
    element: <AdminDashboard />,
  },
  // ROTAS ERP (ObraLog)
  {
    path: '/app/login',
    element: <ObraLogLogin />,
  },
  {
    path: '/app/setup-profile',
    element: <SetupProfile />,
  },
  {
    path: '/app/select-company',
    element: <SelectCompany />,
  },
  {
    path: '/app/dashboard',
    element: <ObraLogDashboard />,
  },
  {
    path: '/app/obras/nova',
    element: <NovaObra />,
  },
  {
    path: '/app/obras',
    element: <ListagemObras />,
  },
  {
    path: '/app/configuracoes',
    element: <Configuracoes />,
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}


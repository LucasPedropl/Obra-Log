import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import LandingPage from '../pages/LandingPage';
import AdminLogin from '../pages/admin/AdminLogin';
import AdminDashboard from '../pages/admin/AdminDashboard';
import ObraLogLogin from '../pages/obralog/ObraLogLogin';
import ObraLogDashboard from '../pages/obralog/ObraLogDashboard';
import SetupProfile from '../pages/obralog/SetupProfile';
import SelectCompany from '../pages/obralog/SelectCompany';
import NovaObra from '../pages/obralog/NovaObra';
import Configuracoes from '../pages/obralog/Configuracoes';
import VisaoGeral from '../pages/obralog/project/VisaoGeral';
import Almoxarifado from '../pages/obralog/project/Almoxarifado';
import FerramentasDisponiveis from '../pages/obralog/project/ferramentas/Disponiveis';
import FerramentasEmprestimos from '../pages/obralog/project/ferramentas/Emprestimos';
import FerramentasHistorico from '../pages/obralog/project/ferramentas/Historico';
import ColaboradoresProjeto from '../pages/obralog/project/Colaboradores';
import EPisDisponiveis from '../pages/obralog/project/epis/Disponiveis';
import EPisHistorico from '../pages/obralog/project/epis/Historico';
import EquipAlugados from '../pages/obralog/project/EquipAlugados';
import Movimentacoes from '../pages/obralog/project/Movimentacoes';

// Novos Menus Principais
import Insumos from '../pages/obralog/config-dados/Insumos';
import UnidadesMedida from '../pages/obralog/config-dados/UnidadesMedida';
import Categorias from '../pages/obralog/config-dados/Categorias';
import MaoDeObra from '../pages/obralog/MaoDeObra';
import Usuarios from '../pages/obralog/acesso/Usuarios';
import PerfisAcesso from '../pages/obralog/acesso/PerfisAcesso';

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
		path: '/app/obras/:id/visao-geral',
		element: <VisaoGeral />,
	},
	{
		path: '/app/obras/:id/almoxarifado',
		element: <Almoxarifado />,
	},
	{
		path: '/app/obras/:id/ferramentas/disponiveis',
		element: <FerramentasDisponiveis />,
	},
	{
		path: '/app/obras/:id/ferramentas/emprestimos',
		element: <FerramentasEmprestimos />,
	},
	{
		path: '/app/obras/:id/ferramentas/historico',
		element: <FerramentasHistorico />,
	},
	{
		path: '/app/obras/:id/colaboradores',
		element: <ColaboradoresProjeto />,
	},
	{
		path: '/app/obras/:id/epis/disponiveis',
		element: <EPisDisponiveis />,
	},
	{
		path: '/app/obras/:id/epis/historico',
		element: <EPisHistorico />,
	},
	{
		path: '/app/obras/:id/equip-alugados',
		element: <EquipAlugados />,
	},
	{
		path: '/app/obras/:id/movimentacoes',
		element: <Movimentacoes />,
	},
	{
		path: '/app/config-dados/insumos',
		element: <Insumos />,
	},
	{
		path: '/app/config-dados/unidades',
		element: <UnidadesMedida />,
	},
	{
		path: '/app/config-dados/categorias',
		element: <Categorias />,
	},
	{
		path: '/app/mao-de-obra',
		element: <MaoDeObra />,
	},
	{
		path: '/app/acesso/usuarios',
		element: <Usuarios />,
	},
	{
		path: '/app/acesso/perfis',
		element: <PerfisAcesso />,
	},
	{
		path: '/app/configuracoes',
		element: <Configuracoes />,
	},
]);

export function AppRouter() {
	return <RouterProvider router={router} />;
}

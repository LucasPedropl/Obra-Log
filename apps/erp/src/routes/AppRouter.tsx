import {
	createBrowserRouter,
	RouterProvider,
	Navigate,
} from 'react-router-dom';

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
import EquipAlugadosAtivos from '../pages/obralog/project/equip-alugados/Ativos';
import EquipAlugadosHistorico from '../pages/obralog/project/equip-alugados/Historico';
import Movimentacoes from '../pages/obralog/project/Movimentacoes';
import MobileProjectMenu from '../pages/obralog/project/MobileProjectMenu';
import Insumos from '../pages/obralog/config-dados/Insumos';
import MaoDeObra from '../pages/obralog/MaoDeObra';
import Usuarios from '../pages/obralog/acesso/Usuarios';
import PerfisAcesso from '../pages/obralog/acesso/PerfisAcesso';
import NotFoundERP from '../pages/obralog/NotFoundERP';
import MobileMenu from '../pages/obralog/MobileMenu';
import { ProtectedRoute } from './ProtectedRoute';

const router = createBrowserRouter([
	{ path: '/', element: <Navigate to="/app/login" replace /> },
	{ path: '/app/login', element: <ObraLogLogin /> },
	{
		path: '/app/setup-profile',
		element: (
			<ProtectedRoute>
				<SetupProfile />
			</ProtectedRoute>
		),
	},
	{
		path: '/app/select-company',
		element: (
			<ProtectedRoute>
				<SelectCompany />
			</ProtectedRoute>
		),
	},
	{
		path: '/app/dashboard',
		element: (
			<ProtectedRoute>
				<ObraLogDashboard />
			</ProtectedRoute>
		),
	},
	{
		path: '/app/obras/nova',
		element: (
			<ProtectedRoute resourceName="obras" requiredAction="create">
				<NovaObra />
			</ProtectedRoute>
		),
	},
	{
		path: '/app/obras/:id/visao-geral',
		element: (
			<ProtectedRoute resourceName="obras" requiredAction="view">
				<VisaoGeral />
			</ProtectedRoute>
		),
	},
	{
		path: '/app/obras/:id/almoxarifado',
		element: (
			<ProtectedRoute resourceName="obras" requiredAction="view">
				<Almoxarifado />
			</ProtectedRoute>
		),
	},
	{
		path: '/app/obras/:id/ferramentas/disponiveis',
		element: (
			<ProtectedRoute resourceName="ferramentas" requiredAction="view">
				<FerramentasDisponiveis />
			</ProtectedRoute>
		),
	},
	{
		path: '/app/obras/:id/ferramentas/emprestimos',
		element: (
			<ProtectedRoute resourceName="ferramentas" requiredAction="view">
				<FerramentasEmprestimos />
			</ProtectedRoute>
		),
	},
	{
		path: '/app/obras/:id/ferramentas/historico',
		element: (
			<ProtectedRoute resourceName="ferramentas" requiredAction="view">
				<FerramentasHistorico />
			</ProtectedRoute>
		),
	},
	{
		path: '/app/obras/:id/colaboradores',
		element: (
			<ProtectedRoute resourceName="colaboradores" requiredAction="view">
				<ColaboradoresProjeto />
			</ProtectedRoute>
		),
	},
	{
		path: '/app/obras/:id/epis/disponiveis',
		element: (
			<ProtectedRoute resourceName="epis" requiredAction="view">
				<EPisDisponiveis />
			</ProtectedRoute>
		),
	},
	{
		path: '/app/obras/:id/epis/historico',
		element: (
			<ProtectedRoute resourceName="epis" requiredAction="view">
				<EPisHistorico />
			</ProtectedRoute>
		),
	},
	{
		path: '/app/obras/:id/equip-alugados',
		element: (
			<ProtectedRoute resourceName="equip_alugados" requiredAction="view">
				<Navigate to="ativos" replace />
			</ProtectedRoute>
		),
	},
	{
		path: '/app/obras/:id/equip-alugados/ativos',
		element: (
			<ProtectedRoute resourceName="equip_alugados" requiredAction="view">
				<EquipAlugadosAtivos />
			</ProtectedRoute>
		),
	},
	{
		path: '/app/obras/:id/equip-alugados/historico',
		element: (
			<ProtectedRoute resourceName="equip_alugados" requiredAction="view">
				<EquipAlugadosHistorico />
			</ProtectedRoute>
		),
	},
	{
		path: '/app/obras/:id/movimentacoes',
		element: (
			<ProtectedRoute resourceName="movimentacoes" requiredAction="view">
				<Movimentacoes />
			</ProtectedRoute>
		),
	},
	{
		path: '/app/obras/:id/menu',
		element: (
			<ProtectedRoute resourceName="obras" requiredAction="view">
				<MobileProjectMenu />
			</ProtectedRoute>
		),
	},
	{
		path: '/app/config-dados/insumos',
		element: (
			<ProtectedRoute resourceName="insumos" requiredAction="view">
				<Insumos />
			</ProtectedRoute>
		),
	},
	{
		path: '/app/mao-de-obra',
		element: (
			<ProtectedRoute resourceName="mao_de_obra" requiredAction="view">
				<MaoDeObra />
			</ProtectedRoute>
		),
	},
	{
		path: '/app/acesso/usuarios',
		element: (
			<ProtectedRoute resourceName="usuarios" requiredAction="view">
				<Usuarios />
			</ProtectedRoute>
		),
	},
	{
		path: '/app/acesso/perfis',
		element: (
			<ProtectedRoute resourceName="perfis" requiredAction="view">
				<PerfisAcesso />
			</ProtectedRoute>
		),
	},
	{
		path: '/app/configuracoes',
		element: (
			<ProtectedRoute>
				<Configuracoes />
			</ProtectedRoute>
		),
	},
	{
		path: '/app/menu',
		element: (
			<ProtectedRoute>
				<MobileMenu />
			</ProtectedRoute>
		),
	},
	{ path: '*', element: <NotFoundERP /> },
]);

export const AppRouter = () => <RouterProvider router={router} />;

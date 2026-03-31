import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";

import ObraLogLogin from "../pages/obralog/ObraLogLogin";
import ObraLogDashboard from "../pages/obralog/ObraLogDashboard";
import SetupProfile from "../pages/obralog/SetupProfile";
import SelectCompany from "../pages/obralog/SelectCompany";
import NovaObra from "../pages/obralog/NovaObra";
import Configuracoes from "../pages/obralog/Configuracoes";
import VisaoGeral from "../pages/obralog/project/VisaoGeral";
import Almoxarifado from "../pages/obralog/project/Almoxarifado";
import FerramentasDisponiveis from "../pages/obralog/project/ferramentas/Disponiveis";
import FerramentasEmprestimos from "../pages/obralog/project/ferramentas/Emprestimos";
import FerramentasHistorico from "../pages/obralog/project/ferramentas/Historico";
import ColaboradoresProjeto from "../pages/obralog/project/Colaboradores";
import EPisDisponiveis from "../pages/obralog/project/epis/Disponiveis";
import EPisHistorico from "../pages/obralog/project/epis/Historico";
import EquipAlugadosAtivos from "../pages/obralog/project/equip-alugados/Ativos";
import EquipAlugadosHistorico from "../pages/obralog/project/equip-alugados/Historico";
import Movimentacoes from "../pages/obralog/project/Movimentacoes";
import MobileProjectMenu from "../pages/obralog/project/MobileProjectMenu";
import Insumos from "../pages/obralog/config-dados/Insumos";
import MaoDeObra from "../pages/obralog/MaoDeObra";
import Usuarios from "../pages/obralog/acesso/Usuarios";
import PerfisAcesso from "../pages/obralog/acesso/PerfisAcesso";
import NotFoundERP from "../pages/obralog/NotFoundERP";
import MobileMenu from "../pages/obralog/MobileMenu";

const router = createBrowserRouter([
	{ path: "/", element: <Navigate to="/app/login" replace /> },
	{ path: "/app/login", element: <ObraLogLogin /> },
	{ path: "/app/setup-profile", element: <SetupProfile /> },
	{ path: "/app/select-company", element: <SelectCompany /> },
	{ path: "/app/dashboard", element: <ObraLogDashboard /> },
	{ path: "/app/obras/nova", element: <NovaObra /> },
	{ path: "/app/obras/:id/visao-geral", element: <VisaoGeral /> },
	{ path: "/app/obras/:id/almoxarifado", element: <Almoxarifado /> },
	{ path: "/app/obras/:id/ferramentas/disponiveis", element: <FerramentasDisponiveis /> },
	{ path: "/app/obras/:id/ferramentas/emprestimos", element: <FerramentasEmprestimos /> },
	{ path: "/app/obras/:id/ferramentas/historico", element: <FerramentasHistorico /> },
	{ path: "/app/obras/:id/colaboradores", element: <ColaboradoresProjeto /> },
	{ path: "/app/obras/:id/epis/disponiveis", element: <EPisDisponiveis /> },
	{ path: "/app/obras/:id/epis/historico", element: <EPisHistorico /> },
	{ path: '/app/obras/:id/equip-alugados', element: <Navigate to="ativos" replace /> },
	{ path: '/app/obras/:id/equip-alugados/ativos', element: <EquipAlugadosAtivos /> },
	{ path: '/app/obras/:id/equip-alugados/historico', element: <EquipAlugadosHistorico /> },
	{ path: "/app/obras/:id/movimentacoes", element: <Movimentacoes /> },
	{ path: "/app/obras/:id/menu", element: <MobileProjectMenu /> },
	{ path: "/app/config-dados/insumos", element: <Insumos /> },
	{ path: "/app/mao-de-obra", element: <MaoDeObra /> },
	{ path: "/app/acesso/usuarios", element: <Usuarios /> },
	{ path: "/app/acesso/perfis", element: <PerfisAcesso /> },
	{ path: "/app/configuracoes", element: <Configuracoes /> },
	{ path: "/app/menu", element: <MobileMenu /> },
	{ path: "*", element: <NotFoundERP /> },
]);

export const AppRouter = () => <RouterProvider router={router} />;

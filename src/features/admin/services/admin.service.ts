// Permite configurar a URL da API via .env (útil se o backend estiver no Render e o front na Vercel)
const API_URL = import.meta.env.VITE_API_URL || 'https://obra-log.onrender.com';

export const adminService = {
  /**
   * Cria uma nova empresa (Tenant)
   */
  async createCompany(name: string) {
    const res = await fetch(`${API_URL}/api/admin/companies`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name })
    });
    
    if (!res.ok) {
      let errMessage = 'Erro ao criar empresa';
      try {
        const err = await res.json();
        errMessage = err.error || errMessage;
      } catch (e) {
        errMessage = `Erro no servidor (${res.status}). A API pode estar offline.`;
      }
      throw new Error(errMessage);
    }
    
    return res.json();
  },

  /**
   * Cria um usuário Admin e vincula à empresa
   */
  async createCompanyAdmin(companyId: string, email: string) {
    const res = await fetch(`${API_URL}/api/admin/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ companyId, email })
    });
    
    if (!res.ok) {
      let errMessage = 'Erro ao criar usuário';
      try {
        const err = await res.json();
        errMessage = err.error || errMessage;
      } catch (e) {
        errMessage = `Erro no servidor (${res.status}). A API pode estar offline.`;
      }
      throw new Error(errMessage);
    }
    
    return res.json();
  },

  /**
   * Lista os usuários de uma empresa
   */
  async getCompanyUsers(companyId: string) {
    const res = await fetch(`${API_URL}/api/admin/companies/${companyId}/users`);
    
    if (!res.ok) {
      let errMessage = 'Erro ao buscar usuários';
      try {
        const err = await res.json();
        errMessage = err.error || errMessage;
      } catch (e) {
        errMessage = `Erro no servidor (${res.status}). A API pode estar offline.`;
      }
      throw new Error(errMessage);
    }
    
    return res.json();
  },

  /**
   * Reseta a senha de um usuário e gera uma nova senha temporária
   */
  async resetUserPassword(userId: string) {
    const res = await fetch(`${API_URL}/api/admin/users/${userId}/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (!res.ok) {
      let errMessage = 'Erro ao resetar senha';
      try {
        const err = await res.json();
        errMessage = err.error || errMessage;
      } catch (e) {
        errMessage = `Erro no servidor (${res.status}). A API pode estar offline.`;
      }
      throw new Error(errMessage);
    }
    
    
    return res.json();
  },

  /**
   * Apaga todo o banco de dados, exceto o usuário admin atual
   */
  async deleteDatabase(adminUserId: string) {
    const res = await fetch(`${API_URL}/api/admin/delete-database`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminUserId })
    });
    
    if (!res.ok) {
      let errMessage = 'Erro ao apagar banco de dados';
      try {
        const err = await res.json();
        errMessage = err.error || errMessage;
      } catch (e) {
        errMessage = `Erro no servidor (${res.status}). A API pode estar offline.`;
      }
      throw new Error(errMessage);
    }
    
    return res.json();
  }
};



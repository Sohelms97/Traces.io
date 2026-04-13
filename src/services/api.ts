const API_BASE = '/api';

class API {
  // Get JWT from localStorage
  getToken() {
    return localStorage.getItem('traces_token');
  }

  // Base fetch with auth header
  async request(method, endpoint, data = null, isFormData = false) {
    const headers = {
      'Authorization': `Bearer ${this.getToken()}`
    };
    
    if (!isFormData) {
      headers['Content-Type'] = 'application/json';
    }
    
    const config: any = {
      method,
      headers,
    };
    
    if (data) {
      config.body = isFormData ? data : JSON.stringify(data);
    }
    
    try {
      const response = await fetch(`${API_BASE}${endpoint}`, config);
      
      // Handle 401 — token expired
      if (response.status === 401) {
        // Try refresh token logic could go here
        // For now, redirect to login
        localStorage.removeItem('traces_token');
        window.location.href = '/login';
        return;
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message);
      }
      
      return result;
      
    } catch (error) {
      console.error("API Error:", error.message);
      throw error;
    }
  }

  // Shorthand methods
  get(endpoint) {
    return this.request('GET', endpoint);
  }
  
  post(endpoint, data, isFormData) {
    return this.request('POST', endpoint, data, isFormData);
  }
  
  put(endpoint, data) {
    return this.request('PUT', endpoint, data);
  }
  
  delete(endpoint) {
    return this.request('DELETE', endpoint);
  }

  // Auth
  async login(username, password) {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, password })
    });
    return response.json();
  }

  // Containers
  getContainers(params = {}) {
    const q = new URLSearchParams(params);
    return this.get(`/containers?${q.toString()}`);
  }
  
  getContainer(id) {
    return this.get(`/containers/${id}`);
  }
  
  createContainer(data: any) {
    return this.post('/containers', data, false);
  }
  
  updateContainer(id: string, data: any) {
    return this.put(`/containers/${id}`, data);
  }
  
  deleteContainer(id) {
    return this.delete(`/containers/${id}`);
  }

  // Products
  getProducts(params = {}) {
    const q = new URLSearchParams(params);
    return this.get(`/products?${q.toString()}`);
  }
  
  createProduct(data: any) {
    return this.post('/products', data, false);
  }
  
  updateProduct(id: string, data: any) {
    return this.put(`/products/${id}`, data);
  }
}

// Global API instance
export const api = new API();

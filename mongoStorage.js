// MongoDB Storage Adapter
const { ipcRenderer } = require('electron');

class MongoDBStorage {
  constructor() {
    this.connected = false;
    this.useLocalStorage = true;
  }

  async connect(connectionString) {
    if (!connectionString || connectionString.trim() === '') {
      console.log('No MongoDB connection string provided, using localStorage');
      this.useLocalStorage = true;
      return true;
    }

    try {
      this.connected = await ipcRenderer.invoke('db-connect', connectionString);
      if (this.connected) {
        this.useLocalStorage = false;
        // Start watching for changes
        ipcRenderer.send('db-watch-cads');
        ipcRenderer.send('db-watch-units');
        console.log('✓ Connected to MongoDB - Real-time sync enabled');
      }
      return this.connected;
    } catch (error) {
      console.error('MongoDB connection failed, falling back to localStorage:', error);
      this.useLocalStorage = true;
      return false;
    }
  }

  // CAD Operations
  async saveCAD(cad) {
    if (this.useLocalStorage) {
      const cads = this.getCADs();
      const index = cads.findIndex(c => c.reference === cad.reference);
      if (index >= 0) {
        cads[index] = cad;
      } else {
        cads.push(cad);
      }
      localStorage.setItem('cads', JSON.stringify(cads));
      window.dispatchEvent(new Event('storage'));
    } else {
      await ipcRenderer.invoke('db-save-cad', cad);
    }
  }

  getCADs() {
    if (this.useLocalStorage) {
      return JSON.parse(localStorage.getItem('cads') || '[]');
    }
    // For MongoDB, this will be populated by real-time updates
    return window.appState?.cads || [];
  }

  async deleteCAD(reference) {
    if (this.useLocalStorage) {
      const cads = this.getCADs();
      const filtered = cads.filter(c => c.reference !== reference);
      localStorage.setItem('cads', JSON.stringify(filtered));
      window.dispatchEvent(new Event('storage'));
    } else {
      await ipcRenderer.invoke('db-delete-cad', reference);
    }
  }

  // Unit Operations
  async saveUnit(unit) {
    if (this.useLocalStorage) {
      const units = this.getUnits();
      const index = units.findIndex(u => u.callsign === unit.callsign);
      if (index >= 0) {
        units[index] = unit;
      } else {
        units.push(unit);
      }
      localStorage.setItem('units', JSON.stringify(units));
      window.dispatchEvent(new Event('storage'));
    } else {
      await ipcRenderer.invoke('db-save-unit', unit);
    }
  }

  getUnits() {
    if (this.useLocalStorage) {
      return JSON.parse(localStorage.getItem('units') || '[]');
    }
    return window.appState?.units || [];
  }

  async deleteUnit(callsign) {
    if (this.useLocalStorage) {
      const units = this.getUnits();
      const filtered = units.filter(u => u.callsign !== callsign);
      localStorage.setItem('units', JSON.stringify(filtered));
      window.dispatchEvent(new Event('storage'));
    } else {
      await ipcRenderer.invoke('db-delete-unit', callsign);
    }
  }

  // Operator Operations
  async saveOperator(operator) {
    if (this.useLocalStorage) {
      const operators = this.getOperators();
      const index = operators.findIndex(o => o.name === operator.name);
      if (index >= 0) {
        operators[index] = operator;
      } else {
        operators.push(operator);
      }
      localStorage.setItem('operators', JSON.stringify(operators));
    } else {
      await ipcRenderer.invoke('db-save-operator', operator);
    }
  }

  getOperators() {
    if (this.useLocalStorage) {
      return JSON.parse(localStorage.getItem('operators') || '[]');
    }
    return window.appState?.operators || [];
  }

  async removeOperator(name) {
    if (this.useLocalStorage) {
      const operators = this.getOperators();
      const filtered = operators.filter(o => o.name !== name);
      localStorage.setItem('operators', JSON.stringify(filtered));
    } else {
      await ipcRenderer.invoke('db-remove-operator', name);
    }
  }

  // Load all data from MongoDB (initial load)
  async loadAllData() {
    if (!this.useLocalStorage && this.connected) {
      const [cads, units, operators] = await Promise.all([
        ipcRenderer.invoke('db-get-cads'),
        ipcRenderer.invoke('db-get-units'),
        ipcRenderer.invoke('db-get-operators')
      ]);
      return { cads, units, operators };
    }
    return null;
  }
}

module.exports = new MongoDBStorage();

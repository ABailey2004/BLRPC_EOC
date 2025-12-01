const { MongoClient } = require('mongodb');

class Database {
  constructor() {
    this.client = null;
    this.db = null;
    this.connected = false;
  }

  async connect(connectionString) {
    try {
      this.client = new MongoClient(connectionString);
      await this.client.connect();
      this.db = this.client.db('blrpc-cad');
      this.connected = true;
      console.log('✓ Connected to MongoDB');
      return true;
    } catch (error) {
      console.error('MongoDB connection failed:', error.message);
      this.connected = false;
      return false;
    }
  }

  async disconnect() {
    if (this.client) {
      await this.client.close();
      this.connected = false;
      console.log('✓ Disconnected from MongoDB');
    }
  }

  isConnected() {
    return this.connected;
  }

  // CAD Operations
  async saveCad(cad) {
    if (!this.connected) return null;
    const result = await this.db.collection('cads').updateOne(
      { reference: cad.reference },
      { $set: cad },
      { upsert: true }
    );
    return result;
  }

  async getCads() {
    if (!this.connected) return [];
    return await this.db.collection('cads').find({}).toArray();
  }

  async deleteCad(reference) {
    if (!this.connected) return null;
    return await this.db.collection('cads').deleteOne({ reference });
  }

  // Unit Operations
  async saveUnit(unit) {
    if (!this.connected) return null;
    const result = await this.db.collection('units').updateOne(
      { callsign: unit.callsign },
      { $set: unit },
      { upsert: true }
    );
    return result;
  }

  async getUnits() {
    if (!this.connected) return [];
    return await this.db.collection('units').find({}).toArray();
  }

  async deleteUnit(callsign) {
    if (!this.connected) return null;
    return await this.db.collection('units').deleteOne({ callsign });
  }

  // Operator Operations
  async saveOperator(operator) {
    if (!this.connected) return null;
    const result = await this.db.collection('operators').updateOne(
      { name: operator.name },
      { $set: { ...operator, lastSeen: new Date() } },
      { upsert: true }
    );
    return result;
  }

  async getOperators() {
    if (!this.connected) return [];
    // Return operators seen in last 5 minutes
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    return await this.db.collection('operators')
      .find({ lastSeen: { $gte: fiveMinutesAgo } })
      .toArray();
  }

  async removeOperator(name) {
    if (!this.connected) return null;
    return await this.db.collection('operators').deleteOne({ name });
  }

  // Watch for changes (real-time updates)
  watchCads(callback) {
    if (!this.connected) return null;
    const changeStream = this.db.collection('cads').watch();
    changeStream.on('change', (change) => {
      callback(change);
    });
    return changeStream;
  }

  watchUnits(callback) {
    if (!this.connected) return null;
    const changeStream = this.db.collection('units').watch();
    changeStream.on('change', (change) => {
      callback(change);
    });
    return changeStream;
  }
}

module.exports = new Database();

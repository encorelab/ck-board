// db.ts
import mongoose from 'mongoose';

class Database {
  private static instance: Database;
  private connection: mongoose.Connection;

  private constructor() {
    const dbUsername = process.env.DB_USER;
    const dbPassword = process.env.DB_PASSWORD;
    const dbUrl = process.env.DB_URL;
    const dbName = process.env.DB_NAME;
    const dbURI = `mongodb+srv://${dbUsername}:${dbPassword}@${dbUrl}.mongodb.net/${dbName}?retryWrites=true&w=majority`;

    this.connection = mongoose.createConnection(dbURI);
    
    this.connection.on('error', (error) => {
      console.error('MongoDB connection error:', error);
    });

    this.connection.once('open', () => {
      console.log('Connected to MongoDB');
    });
  }

  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  public getConnection(): mongoose.Connection {
    return this.connection;
  }
}

export default Database.getInstance(); 

import mongoose from 'mongoose';
import { startCronJobs } from './cronJobs';
import { logSpinConfig } from '../config/spinConfig';

export const connectDB = async (): Promise<void> => {
    try {
        const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/gimble-bible';
        await mongoose.connect(mongoURI);
        console.log('✅ MongoDB connected successfully');
        
        // Log spin configuration
        logSpinConfig();
        
        // Start cron jobs after successful DB connection
        startCronJobs();
        
    } catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    }
};
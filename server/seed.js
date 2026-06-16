import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import User from './src/models/User.js';
import Asset from './src/models/Asset.js';
import Query from './src/models/Query.js';

dotenv.config();

const seedDB = async () => {
  const dbUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/asset_management';
  console.log('Connecting to database for seeding...');

  try {
    await mongoose.connect(dbUri, {
      serverSelectionTimeoutMS: 3000
    });
    console.log('Connected to database.');

    // Clear existing data
    console.log('Clearing database collection data...');
    await User.deleteMany({});
    await Asset.deleteMany({});
    await Query.deleteMany({});

    // Seed Users (Normal user and Admin user)
    console.log('Seeding users...');
    const salt = await bcrypt.genSalt(10);
    const userPasswordHash = await bcrypt.hash('user123', salt);
    const adminPasswordHash = await bcrypt.hash('admin123', salt);

    const seededUsers = await User.create([
      {
        name: 'Regular User',
        email: 'user@example.com',
        passwordHash: userPasswordHash,
        role: 'user'
      },
      {
        name: 'System Admin',
        email: 'admin@example.com',
        passwordHash: adminPasswordHash,
        role: 'admin'
      }
    ]);
    console.log(`Successfully seeded ${seededUsers.length} users:`);
    console.log(` - Standard User: user@example.com / user123`);
    console.log(` - Admin User: admin@example.com / admin123`);

    // Seed 10 Assets
    console.log('Seeding assets...');
    const seededAssets = await Asset.create([
      {
        title: 'Q4 Financial Report 2026',
        description: 'Comprehensive financial statements, revenue targets, and actual profits for the final quarter of the fiscal year.',
        fileType: 'pdf',
        s3Key: 'reports/q4_financial_2026.pdf',
        size: 2451000 // ~2.4 MB
      },
      {
        title: 'Brand Identity Guidelines',
        description: 'Official typography, logo assets, brand palettes, and style standards for digital and print assets.',
        fileType: 'pdf',
        s3Key: 'branding/guidelines_v2.pdf',
        size: 8493000 // ~8.1 MB
      },
      {
        title: 'Employee Handbook 2026',
        description: 'Company culture, office rules, holidays list, standard operating procedures, and employee benefits breakdown.',
        fileType: 'pdf',
        s3Key: 'hr/employee_handbook_2026.pdf',
        size: 1258000 // ~1.2 MB
      },
      {
        title: 'SaaS Platform Architecture Diagram',
        description: 'Multi-region AWS setup diagram including load balancers, ECS service containers, RDS clusters, and S3 file vaults.',
        fileType: 'image',
        s3Key: 'diagrams/architecture_diagram.svg',
        size: 460800 // ~450 KB
      },
      {
        title: 'Dashboard Interface Mockup',
        description: 'High-fidelity UI mockups for the main customer dashboard interface containing stats widgets and navigation rails.',
        fileType: 'image',
        s3Key: 'ui-mockups/dashboard_desktop.svg',
        size: 1887000 // ~1.8 MB
      },
      {
        title: 'User Onboarding Flowchart',
        description: 'Wireframe mapping the complete sequence of screens and authentication states for new customer registration.',
        fileType: 'image',
        s3Key: 'wireframes/user_onboarding.svg',
        size: 911000 // ~890 KB
      },
      {
        title: 'API Reference Documentation',
        description: 'Markdown document detailing all developer endpoints, input payload validations, and HTTP response schemas.',
        fileType: 'text',
        s3Key: 'docs/api_reference.txt',
        size: 12288 // 12 KB
      },
      {
        title: 'PostgreSQL Database Setup Script',
        description: 'Raw SQL schema script for setting up relational tables, indexes, database triggers, and user table foreign keys.',
        fileType: 'text',
        s3Key: 'scripts/db_init_schema.sql',
        size: 4096 // 4 KB
      },
      {
        title: 'Support Service Level Agreements (SLA)',
        description: 'Customer support ticketing timelines, priority levels, resolution guarantees, and admin escalation procedures.',
        fileType: 'text',
        s3Key: 'legal/sla_guidelines.txt',
        size: 8192 // 8 KB
      },
      {
        title: 'AWS ECS Deployment Script',
        description: 'Configuration file template containing environment injections, health checks, and task specifications for Docker instances.',
        fileType: 'text',
        s3Key: 'devops/ecs_deploy_task.json',
        size: 15360 // 15 KB
      }
    ]);

    console.log(`Successfully seeded ${seededAssets.length} assets.`);
    console.log('Seeding complete. Exiting.');
    process.exit(0);
  } catch (error) {
    console.error('Seeding Failed:', error.message);
    process.exit(1);
  }
};

seedDB();

import User from '../models/User.js';
import Asset from '../models/Asset.js';
import Query from '../models/Query.js';
import bcrypt from 'bcrypt';

export const autoSeed = async () => {
  try {
    const assetCount = await Asset.countDocuments();
    if (assetCount > 0) {
      console.log('Database Seeding: Database already has assets. Skipping auto-seed.');
      return;
    }

    console.log('Database Seeding: Empty database detected. Initiating auto-seed...');

    // Clear any residual partial data
    await User.deleteMany({});
    await Query.deleteMany({});

    // Seed default users
    const salt = await bcrypt.genSalt(10);
    const userPasswordHash = await bcrypt.hash('user123', salt);
    const adminPasswordHash = await bcrypt.hash('admin123', salt);

    await User.create([
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

    // Seed 10 sample assets
    await Asset.create([
      {
        title: 'Q4 Financial Report 2026',
        description: 'Comprehensive financial statements, revenue targets, and actual profits for the final quarter of the fiscal year.',
        fileType: 'pdf',
        s3Key: 'reports/q4_financial_2026.pdf',
        size: 2451000
      },
      {
        title: 'Brand Identity Guidelines',
        description: 'Official typography, logo assets, brand palettes, and style standards for digital and print assets.',
        fileType: 'pdf',
        s3Key: 'branding/guidelines_v2.pdf',
        size: 8493000
      },
      {
        title: 'Employee Handbook 2026',
        description: 'Company culture, office rules, holidays list, standard operating procedures, and employee benefits breakdown.',
        fileType: 'pdf',
        s3Key: 'hr/employee_handbook_2026.pdf',
        size: 1258000
      },
      {
        title: 'SaaS Platform Architecture Diagram',
        description: 'Multi-region AWS setup diagram including load balancers, ECS service containers, RDS clusters, and S3 file vaults.',
        fileType: 'image',
        s3Key: 'diagrams/architecture_diagram.svg',
        size: 460800
      },
      {
        title: 'Dashboard Interface Mockup',
        description: 'High-fidelity UI mockups for the main customer dashboard interface containing stats widgets and navigation rails.',
        fileType: 'image',
        s3Key: 'ui-mockups/dashboard_desktop.svg',
        size: 1887000
      },
      {
        title: 'User Onboarding Flowchart',
        description: 'Wireframe mapping the complete sequence of screens and authentication states for new customer registration.',
        fileType: 'image',
        s3Key: 'wireframes/user_onboarding.svg',
        size: 911000
      },
      {
        title: 'API Reference Documentation',
        description: 'Markdown document detailing all developer endpoints, input payload validations, and HTTP response schemas.',
        fileType: 'text',
        s3Key: 'docs/api_reference.txt',
        size: 12288
      },
      {
        title: 'PostgreSQL Database Setup Script',
        description: 'Raw SQL schema script for setting up relational tables, indexes, database triggers, and user table foreign keys.',
        fileType: 'text',
        s3Key: 'scripts/db_init_schema.sql',
        size: 4096
      },
      {
        title: 'Support Service Level Agreements (SLA)',
        description: 'Customer support ticketing timelines, priority levels, resolution guarantees, and admin escalation procedures.',
        fileType: 'text',
        s3Key: 'legal/sla_guidelines.txt',
        size: 8192
      },
      {
        title: 'AWS ECS Deployment Script',
        description: 'Configuration file template containing environment injections, health checks, and task specifications for Docker instances.',
        fileType: 'text',
        s3Key: 'devops/ecs_deploy_task.json',
        size: 15360
      }
    ]);

    console.log('Database Seeding: Successfully auto-seeded default credentials and 10 assets.');
    console.log(' - User Credentials: user@example.com / user123');
    console.log(' - Admin Credentials: admin@example.com / admin123');
  } catch (err) {
    console.error('Database Seeding: Auto-seeding failed:', err.message);
  }
};

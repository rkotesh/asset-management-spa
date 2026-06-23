import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import User from './src/models/User.js';
import Asset from './src/models/Asset.js';
import Query from './src/models/Query.js';
import Workflow from './src/models/Workflow.js';

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
    await Workflow.deleteMany({});

    // Seed default admin user
    console.log('Seeding users...');
    const salt = await bcrypt.genSalt(10);
    const adminPasswordHash = await bcrypt.hash('Ram9182@', salt);

    const seededUsers = await User.create([
      {
        name: 'System Admin',
        email: 'srkotesh23@gmail.com',
        passwordHash: adminPasswordHash,
        role: 'admin',
        status: 'active',
        notifications_enabled: true
      }
    ]);

    // Seed default workflow configuration
    console.log('Seeding default workflow configuration...');
    const defaultWorkflow = {
      name: "New Asset Upload Notification",
      trigger: {
        event: "asset.uploaded",
        description: "Fires when a new file is uploaded to the application",
        payload: {
          asset_id: "string",
          asset_name: "string",
          asset_type: "string",
          asset_url: "string",
          thumbnail_url: "string",
          uploaded_by: "string",
          uploaded_at: "string",
          file_size_mb: "number",
          description: "string"
        }
      },
      actions: [
        {
          step: 1,
          action: "fetch_users",
          description: "Get all active application users who should receive the notification",
          source: "database",
          query: {
            table: "users",
            filter: {
              status: "active",
              notifications_enabled: true
            },
            fields: ["id", "name", "email"]
          }
        },
        {
          step: 2,
          action: "send_email",
          description: "Send notification email to each user",
          provider: "your_email_provider",
          for_each: "user in users",
          email: {
            to: "{{user.email}}",
            subject: "New Asset Uploaded: {{asset_name}}",
            body: {
              greeting: "Hi {{user.name}},",
              message: "A new asset has been uploaded to the application.",
              asset_info: {
                name: "{{asset_name}}",
                type: "{{asset_type}}",
                uploaded_by: "{{uploaded_by}}",
                uploaded_at: "{{uploaded_at}}",
                file_size: "{{file_size_mb}} MB",
                description: "{{description}}",
                link: "{{asset_url}}",
                thumbnail: "{{thumbnail_url}}"
              },
              cta_button: {
                label: "View Asset",
                url: "{{asset_url}}"
              },
              footer: "You are receiving this because you are a registered user. To unsubscribe, update your notification preferences."
            }
          }
        }
      ],
      conditions: {
        skip_if: [
          "asset_url is null",
          "users list is empty"
        ]
      },
      metadata: {
        notification_type: "asset_upload",
        priority: "normal",
        retry_on_failure: true,
        max_retries: 3
      }
    };
    await Workflow.create(defaultWorkflow);
    console.log(`Successfully seeded ${seededUsers.length} user(s):`);
    console.log(` - Admin User: srkotesh23@gmail.com / Ram9182@`);

    console.log('Seeding complete. Exiting.');
    process.exit(0);
  } catch (error) {
    console.error('Seeding Failed:', error.message);
    process.exit(1);
  }
};

seedDB();

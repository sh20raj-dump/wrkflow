import { getDB } from '@/lib/db';
import { generateUniqueSlug } from '@/lib/slug-utils';
import { users, workflows } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

// Sample workflow data templates
const workflowTemplates = [
  {
    title: "E-commerce Product Catalog Automation",
    description: "Automate product listings, inventory management, and order processing for online stores. Includes automated price updates and inventory alerts.",
    jsonContent: JSON.stringify({
      name: "E-commerce Automation",
      version: "1.0",
      steps: [
        { action: "fetch_products", source: "shopify_api" },
        { action: "update_inventory", target: "database" },
        { action: "send_notifications", type: "email" }
      ]
    }),
    tags: JSON.stringify(["e-commerce", "automation", "inventory", "shopify"]),
    howItWorks: "This workflow automatically syncs your product catalog across multiple platforms and sends alerts when inventory is low.",
    stepByStep: "1. Connect your e-commerce platform\n2. Configure inventory thresholds\n3. Set up notification preferences\n4. Run the automation",
    categoryId: null
  },
  {
    title: "Social Media Content Scheduler",
    description: "Schedule and post content across multiple social media platforms with automatic hashtag optimization and engagement tracking.",
    jsonContent: JSON.stringify({
      name: "Social Media Scheduler",
      version: "1.2",
      steps: [
        { action: "create_post", platform: "twitter" },
        { action: "schedule_post", time: "optimal" },
        { action: "track_engagement", metrics: ["likes", "shares"] }
      ]
    }),
    tags: JSON.stringify(["social-media", "marketing", "automation", "scheduling"]),
    howItWorks: "Automatically posts your content at optimal times and tracks engagement metrics across platforms.",
    stepByStep: "1. Upload your content\n2. Select target platforms\n3. Set posting schedule\n4. Monitor performance",
    categoryId: null
  },
  {
    title: "Customer Support Ticket Routing",
    description: "Intelligent ticket routing system that categorizes support requests and assigns them to the right team members based on expertise.",
    jsonContent: JSON.stringify({
      name: "Support Ticket Router",
      version: "2.0",
      steps: [
        { action: "analyze_ticket", method: "nlp" },
        { action: "categorize", categories: ["technical", "billing", "general"] },
        { action: "assign_agent", criteria: "expertise" }
      ]
    }),
    tags: JSON.stringify(["customer-support", "automation", "routing", "ai"]),
    howItWorks: "Uses AI to analyze incoming tickets and automatically routes them to the most qualified support agent.",
    stepByStep: "1. Configure ticket categories\n2. Set up agent skills\n3. Define routing rules\n4. Monitor performance",
    categoryId: null
  },
  {
    title: "Lead Generation and Nurturing",
    description: "Automated lead generation system that identifies potential customers and nurtures them through personalized email sequences.",
    jsonContent: JSON.stringify({
      name: "Lead Nurturing",
      version: "1.5",
      steps: [
        { action: "identify_leads", source: "website_visitors" },
        { action: "score_leads", criteria: ["engagement", "demographics"] },
        { action: "send_sequence", type: "email_campaign" }
      ]
    }),
    tags: JSON.stringify(["lead-generation", "marketing", "email", "automation"]),
    howItWorks: "Tracks visitor behavior and automatically sends targeted email sequences to convert prospects into customers.",
    stepByStep: "1. Set up tracking pixels\n2. Configure lead scoring\n3. Create email sequences\n4. Monitor conversions",
    categoryId: null
  },
  {
    title: "Data Backup and Sync Automation",
    description: "Automated data backup solution that syncs files across multiple cloud storage providers with versioning and encryption.",
    jsonContent: JSON.stringify({
      name: "Data Backup Sync",
      version: "3.0",
      steps: [
        { action: "scan_files", location: "local_drive" },
        { action: "encrypt_data", algorithm: "AES-256" },
        { action: "upload_backup", destinations: ["aws_s3", "google_drive"] }
      ]
    }),
    tags: JSON.stringify(["backup", "cloud-storage", "automation", "security"]),
    howItWorks: "Automatically backs up your important files to multiple cloud storage providers with encryption and versioning.",
    stepByStep: "1. Select files to backup\n2. Choose storage providers\n3. Configure backup schedule\n4. Monitor backup status",
    categoryId: null
  }
];

// Generate more workflow variations
function generateWorkflowVariations() {
  const variations = [];
  const titles = [
    "Website SEO Optimizer", "Email Marketing Automation", "Invoice Processing System",
    "Social Media Analytics Dashboard", "Project Management Tracker", "Customer Feedback Collector",
    "Appointment Scheduling Bot", "Expense Report Generator", "Content Curation Engine",
    "Lead Scoring Algorithm", "Inventory Alert System", "Performance Monitoring Tool",
    "Document Generation Workflow", "Task Assignment Automation", "Sales Pipeline Manager",
    "Customer Onboarding Flow", "Event Registration System", "Survey Data Processor",
    "Content Approval Workflow", "Payment Processing Automation", "User Access Manager",
    "Report Generation System", "Email Newsletter Builder", "Product Launch Checklist",
    "Quality Assurance Workflow", "Budget Tracking System", "Team Collaboration Hub",
    "Knowledge Base Updater", "Customer Journey Mapper", "Resource Allocation Tool",
    "Compliance Monitoring System", "Training Progress Tracker", "Vendor Management Portal",
    "Asset Inventory System", "Bug Tracking Workflow", "Feature Request Handler",
    "Client Communication Hub", "Time Tracking Automation", "Goal Progress Monitor",
    "Campaign Performance Analyzer", "User Behavior Tracker", "Content Publishing Pipeline",
    "Database Maintenance Script", "API Integration Manager", "Security Audit Workflow",
    "Backup Verification System", "Log Analysis Tool"
  ];

  const descriptions = [
    "Streamline your business processes with this powerful automation workflow.",
    "Increase productivity and efficiency with automated task management.",
    "Reduce manual work and eliminate errors with intelligent automation.",
    "Optimize your workflow with smart routing and decision-making capabilities.",
    "Enhance customer experience through automated and personalized interactions.",
    "Simplify complex processes with step-by-step automation sequences.",
    "Boost team collaboration with automated communication workflows.",
    "Monitor and analyze performance with real-time data processing.",
    "Automate repetitive tasks to focus on strategic initiatives.",
    "Improve accuracy and consistency with standardized automation processes."
  ];

  const categories = [null, null, null, null, null];

  for (let i = 0; i < titles.length; i++) {
    const title = titles[i];
    const description = descriptions[i % descriptions.length];
    const categoryId = categories[i % categories.length];
    
    variations.push({
      title,
      description,
      jsonContent: JSON.stringify({
        name: title.replace(/\s+/g, '_').toLowerCase(),
        version: `1.${Math.floor(Math.random() * 9)}`,
        steps: [
          { action: "initialize", type: "setup" },
          { action: "process", method: "automated" },
          { action: "complete", output: "result" }
        ]
      }),
      tags: JSON.stringify(["automation", "workflow", "productivity"]),
      howItWorks: `This ${title.toLowerCase()} helps you automate complex processes with ease.`,
      stepByStep: "1. Configure your settings\n2. Set up automation rules\n3. Test the workflow\n4. Deploy and monitor",
      categoryId,
      isPaid: Math.random() > 0.7, // 30% chance of being paid
      price: Math.random() > 0.7 ? Math.floor(Math.random() * 100) + 10 : null,
      viewCount: Math.floor(Math.random() * 1000),
      downloadCount: Math.floor(Math.random() * 500)
    });
  }

  return variations;
}

async function seedWorkflows() {
  try {
    const db = getDB();
    
    // First, check if user exists
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, 'shaswatraj3@gmail.com'))
      .limit(1);

    let userId;
    if (!existingUser) {
      // Create the user if they don't exist
      const [newUser] = await db
        .insert(users)
        .values({
          email: 'shaswatraj3@gmail.com',
          name: 'Shaswat Raj',
          avatar: 'https://github.com/SH20RAJ.png',
          bio: 'Workflow automation enthusiast and developer'
        })
        .returning();
      userId = newUser.id;
      console.info('Created new user:', newUser);
    } else {
      userId = existingUser.id;
      console.info('Using existing user:', existingUser);
    }

    // Generate all workflow variations
    const allWorkflows = [...workflowTemplates, ...generateWorkflowVariations()];
    
    // Insert workflows in batches
    const batchSize = 10;
    let insertedCount = 0;
    
    for (let i = 0; i < allWorkflows.length && insertedCount < 50; i += batchSize) {
      const batch = allWorkflows.slice(i, i + batchSize).slice(0, 50 - insertedCount);
      
      const workflowsToInsert = await Promise.all(batch.map(async (workflow) => ({
        ...workflow,
        userId,
        slug: await generateUniqueSlug(workflow.title),
        coverImage: `https://picsum.photos/800/600?random=${i + Math.random()}`,
        posterImage: `https://picsum.photos/1200/800?random=${i + Math.random() + 1000}`,
        youtubeUrl: Math.random() > 0.8 ? `https://youtube.com/watch?v=dQw4w9WgXcQ${i}` : null,
        screenshots: JSON.stringify([
          `https://picsum.photos/1024/768?random=${i + 2000}`,
          `https://picsum.photos/1024/768?random=${i + 3000}`
        ]),
        demoImages: JSON.stringify([
          `https://picsum.photos/800/600?random=${i + 4000}`,
          `https://picsum.photos/800/600?random=${i + 5000}`
        ])
      })));

      const insertedWorkflows = await db
        .insert(workflows)
        .values(workflowsToInsert)
        .returning();

      insertedCount += insertedWorkflows.length;
      console.info(`Inserted batch ${Math.floor(i / batchSize) + 1}: ${insertedWorkflows.length} workflows`);
    }

    console.info(`Successfully seeded ${insertedCount} workflows for user: shaswatraj3@gmail.com`);
    return { success: true, count: insertedCount };

  } catch (error) {
    console.error('Error seeding workflows:', error);
    throw error;
  }
}

// Export for use in API or direct execution
export { seedWorkflows };

// If running directly
if (require.main === module) {
  seedWorkflows()
    .then((result) => {
      console.info('Seeding completed:', result);
      process.exit(0);
    })
    .catch((error) => {
      console.error('Seeding failed:', error);
      process.exit(1);
    });
}

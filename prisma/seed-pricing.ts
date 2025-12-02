import { config } from 'dotenv';
config({ path: '.env.local' });
config({ path: '.env' });

async function main() {
    const { prisma } = await import('../lib/db');
    console.log('🌱 Seeding model pricing...');

    const models = [
        {
            model: 'anthropic/claude-3.5-sonnet',
            promptCostPer1k: 0.003, // $3 per 1M
            completionCostPer1k: 0.015, // $15 per 1M
        },
        {
            model: 'meta-llama/llama-4-scout:nitro', // Assuming this is the exact string used in code
            promptCostPer1k: 0.0002, // Approximate/Example pricing
            completionCostPer1k: 0.0002,
        },
        // Add other models if needed
    ];

    try {
        for (const m of models) {
            await prisma.modelPricing.upsert({
                where: { model: m.model },
                update: {
                    promptCostPer1k: m.promptCostPer1k,
                    completionCostPer1k: m.completionCostPer1k,
                },
                create: m,
            });
        }

        console.log('✅ Model pricing seeded.');
    } finally {
        await prisma.$disconnect();
    }
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});

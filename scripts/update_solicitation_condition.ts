import { prisma } from '@/lib/db';

async function main() {
    const fieldId = 'cmj15wzdy000304l5j2vjoch0';
    const newCondition = JSON.stringify({
        operator: 'and',
        rules: [{ field: 'includeNonSolicit', operator: 'equals', value: true }]
    });
    await prisma.field.update({
        where: { id: fieldId },
        data: { conditions: newCondition }
    });
    console.log('Updated conditions for field', fieldId);
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

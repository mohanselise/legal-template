import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const template = await prisma.template.findFirst({
        where: {
            OR: [
                { slug: 'nda' },
                { id: 'd11a31b2-23e3-4321-8ac8-6ef7e68a215c' }
            ]
        },
        include: {
            screens: {
                orderBy: { order: 'asc' },
                include: {
                    fields: {
                        orderBy: { order: 'asc' }
                    }
                }
            }
        }
    });

    if (!template) {
        console.error('Template not found');
        process.exit(1);
    }

    console.log(JSON.stringify(template, null, 2));
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

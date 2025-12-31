import { PrismaClient } from '@prisma/client';
import { PasswordHasher } from '../backend/infrastructure/auth/PasswordHasher';

const prisma = new PrismaClient();

async function main() {
    const email = 'admin@sistema.com';
    const existingUser = await prisma.user.findUnique({
        where: { email },
    });

    if (!existingUser) {
        console.log('Creating admin user...');
        const passwordHash = await PasswordHasher.hash('Admin123!');

        await prisma.user.create({
            data: {
                email,
                passwordHash,
                name: 'Administrador',
                role: 'ADMIN',
                status: 'ACTIVE',
            },
        });
        console.log('Admin user created');
    } else {
        console.log('Admin user already exists');
    }

    // Create Default Company
    const existingCompany = await prisma.company.findUnique({
        where: { taxId: '900000000' }
    });

    let companyId = existingCompany?.id;

    if (!existingCompany) {
        console.log('Creating default company...');
        const company = await prisma.company.create({
            data: {
                commercialName: 'Mi Empresa Demo',
                legalName: 'Empresa Demo S.A.S.',
                taxId: '900000000',
                contactEmail: 'contacto@empresa.com'
            }
        });
        companyId = company.id;
        console.log('Company created');
    } else {
        console.log('Company already exists');
    }

    // Create Default Warehouse
    const existingWarehouse = await prisma.warehouse.findFirst({
        where: { companyId }
    });

    if (!existingWarehouse && companyId) {
        console.log('Creating default warehouse...');
        await prisma.warehouse.create({
            data: {
                name: 'Almacén Principal',
                location: 'Sede Central',
                companyId: companyId
            }
        });
        console.log('Warehouse created');
    } else {
        console.log('Warehouse already exists');
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

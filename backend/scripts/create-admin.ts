import knex from '../database/index.schema';
import bcrypt from 'bcrypt';

/**
 * Script to create default users (admin and employee)
 * Run with: npm run create-admin
 */

async function createDefaultUsers() {
    try {
        const adminEmail = process.env.ADMIN_EMAIL || 'admin@gmail.com';
        const adminPassword = process.env.ADMIN_PASSWORD || '12345678';
        const adminName = process.env.ADMIN_NAME || 'Admin User';

        const employeeEmail = process.env.EMPLOYEE_EMAIL || 'employee@gmail.com';
        const employeePassword = process.env.EMPLOYEE_PASSWORD || '12345678';
        const employeeName = process.env.EMPLOYEE_NAME || 'Employee User';

        console.log('🔧 Setting up default users (Admin & Employee)...');

        // 1. Admin User Setup
        let adminId: number;
        const existingAdmin = await knex('users')
            .where({ email: adminEmail })
            .first();

        if (existingAdmin) {
            console.log('⚠️  Admin user already exists with email:', adminEmail);
            console.log('   User ID:', existingAdmin.id);
            adminId = existingAdmin.id;
        } else {
            const hashedPassword = await bcrypt.hash(adminPassword, 10);
            const [admin] = await knex('users')
                .insert({
                    email: adminEmail,
                    password: hashedPassword,
                    name: adminName,
                    role: 'admin',
                    onboarding_completed: true,
                    created_by: 1, // Temporary value, will update to self-reference
                    created_at: new Date(),
                    updated_at: new Date(),
                })
                .returning('*');

            adminId = admin.id;

            // Update created_by to reference itself (self-created)
            await knex('users')
                .where({ id: adminId })
                .update({ created_by: adminId });

            console.log('✅ Admin user created successfully!');
            console.log('   ID:', adminId);
        }

        // 2. Employee User Setup
        const existingEmployee = await knex('users')
            .where({ email: employeeEmail })
            .first();

        if (existingEmployee) {
            console.log('⚠️  Employee user already exists with email:', employeeEmail);
            console.log('   User ID:', existingEmployee.id);
        } else {
            const hashedEmployeePassword = await bcrypt.hash(employeePassword, 10);
            const [employee] = await knex('users')
                .insert({
                    email: employeeEmail,
                    password: hashedEmployeePassword,
                    name: employeeName,
                    role: 'employee',
                    onboarding_completed: true, // Set to true for instant access during demo
                    created_by: adminId,
                    created_at: new Date(),
                    updated_at: new Date(),
                })
                .returning('*');

            console.log('✅ Employee user created successfully!');
            console.log('   ID:', employee.id);
        }

        console.log('\n📌 Login credentials:');
        console.log('-------------------------------');
        console.log('👑 ADMIN ROLE:');
        console.log('   Email:   ', adminEmail);
        console.log('   Password:', adminPassword);
        console.log('-------------------------------');
        console.log('👥 EMPLOYEE ROLE:');
        console.log('   Email:   ', employeeEmail);
        console.log('   Password:', employeePassword);
        console.log('-------------------------------');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error setting up default users:', error);
        process.exit(1);
    }
}

createDefaultUsers();


import { hash } from 'bcrypt';
import { eq } from 'drizzle-orm';
import { users, categories } from '../../database/schema';
import { db, fetchOne } from '../../utils/db';

export default defineEventHandler(async (event) => {
    const body = await readBody(event);
    const { email, password, name } = body;

    if (!email || !password || !name) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Email, password and name are required',
        });
    }

    // Check if user already exists
    const existingUser = await fetchOne(db.select().from(users as any).where(eq((users as any).email, email)));
    if (existingUser) {
        throw createError({
            statusCode: 409,
            statusMessage: 'Email already in use',
        });
    }

    // Hash password
    const hashedPassword = await hash(password, 10);

    // Create user
    const newUser = await fetchOne(db.insert(users as any).values({
        email,
        name,
        password: hashedPassword,
    } as any).returning());

    if (!newUser) {
        throw createError({
            statusCode: 500,
            statusMessage: 'Error creating user',
        });
    }

    // Seed default categories
    const defaultCategories = [
        { name: 'Alimentation', icon: '<svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>', color: '#679178' },
        { name: 'Shopping', icon: '<svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>', color: '#557a66' },
        { name: 'Transports', icon: '<svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>', color: '#223d31' },
        { name: 'Logement', icon: '<svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>', color: '#1b3127' },
        { name: 'Sorties', icon: '<svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M21 15.546c-.523 0-1.046.151-1.5.454a2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.701 2.701 0 00-1.5-.454M9 6v2m3-2v2m3-2v2M9 3h.01M12 3h.01M15 3h.01M21 21v-7a2 2 0 00-2-2H5a2 2 0 00-2 2v7h18zm-3-9v-2a2 2 0 00-2-2H8a2 2 0 00-2 2v2h12z" /></svg>', color: '#3b5e4a' }
    ];

    for (const cat of defaultCategories) {
        await db.insert(categories as any).values({
            userId: newUser.id,
            ...cat
        } as any).execute();
    }

    // Create session
    await setUserSession(event, {
        user: {
            id: newUser.id,
            email: newUser.email,
            name: newUser.name,
        },
    });

    return {
        user: {
            id: newUser.id,
            email: newUser.email,
            name: newUser.name,
        },
    };
});

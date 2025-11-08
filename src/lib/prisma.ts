// place files you want to import through the `$lib` alias in this folder.
import { PrismaClient } from '../generated/prisma/client.js';
import { DATABASE_URL } from '$env/static/private';

const prisma = new PrismaClient({
	datasourceUrl: DATABASE_URL
});

export default prisma;

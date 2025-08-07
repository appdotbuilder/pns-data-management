
import { db } from '../db';
import { pegawaiTable } from '../db/schema';
import { type Pegawai } from '../schema';
import { and, gte, lte, eq } from 'drizzle-orm';

export async function getPegawaiMendekatiPensiun(): Promise<Pegawai[]> {
  try {
    const today = new Date();
    
    // Calculate date range for employees approaching retirement
    // We want employees who are currently 56-60 years old
    // Birth date range: 60 years ago to 56 years ago from today
    
    const oldestBirthDate = new Date();
    oldestBirthDate.setFullYear(today.getFullYear() - 60);
    // Subtract one day to ensure we include people who are exactly 60
    oldestBirthDate.setDate(oldestBirthDate.getDate() - 1);
    
    const youngestBirthDate = new Date();
    youngestBirthDate.setFullYear(today.getFullYear() - 56);
    // Add one day to ensure we include people who are exactly 56
    youngestBirthDate.setDate(youngestBirthDate.getDate() + 1);
    
    const results = await db.select()
      .from(pegawaiTable)
      .where(
        and(
          eq(pegawaiTable.is_active, true),
          gte(pegawaiTable.tanggal_lahir, oldestBirthDate),
          lte(pegawaiTable.tanggal_lahir, youngestBirthDate)
        )
      )
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to get pegawai approaching retirement:', error);
    throw error;
  }
}

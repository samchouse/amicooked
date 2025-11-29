'use server';

import { getStudentData as fetchStudentData } from '@/lib/dataset';

export async function getStudentData() {
  return await fetchStudentData();
}

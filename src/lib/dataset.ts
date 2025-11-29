import fs from 'fs';
import path from 'path';

interface Student {
  school: string;
  sex: string;
  age: number;
  address: string;
  famsize: string;
  Pstatus: string;
  Medu: number;
  Fedu: number;
  Mjob: string;
  Fjob: string;
  reason: string;
  guardian: string;
  traveltime: number;
  studytime: number;
  failures: number;
  schoolsup: string;
  famsup: string;
  paid: string;
  activities: string;
  nursery: string;
  higher: string;
  internet: string;
  romantic: string;
  famrel: number;
  freetime: number;
  goout: number;
  Dalc: number;
  Walc: number;
  health: number;
  absences: number;
  G1: number | string; // Some G1, G2, G3 are strings in the CSV output above like "0"
  G2: number | string;
  G3: number;
}

export async function getStudentData(): Promise<Student[]> {
  try {
    const filePath = path.join(process.cwd(), 'api/student-por.csv');
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    
    const rows = fileContent.trim().split('\n');
    const headers = rows[0].split(',').map(h => h.trim().replace(/"/g, ''));
    
    const data = rows.slice(1).map(row => {
      const values = row.split(',').map(v => v.trim().replace(/"/g, ''));
      const student: any = {};
      
      headers.forEach((header, index) => {
        const value = values[index];
        // Attempt to convert to number if possible
        if (!isNaN(Number(value)) && value !== '') {
          student[header] = Number(value);
        } else {
          student[header] = value;
        }
      });
      
      return student as Student;
    });

    return data;
  } catch (error) {
    console.error("Error reading student data:", error);
    return [];
  }
}

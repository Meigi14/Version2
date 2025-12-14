import * as XLSX from 'xlsx';
import { MaterialItem } from '../types';

export const parseExcel = async (file: File): Promise<MaterialItem[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convert to JSON (Header is row 0)
        // Expected: A=Material, B=Length, C=Width, D=Height
        const jsonData: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        const materials: MaterialItem[] = [];

        // Skip header row (index 0), start from 1
        for (let i = 1; i < jsonData.length; i++) {
          const row = jsonData[i];
          if (!row || row.length < 4) continue;

          // Robust parsing to handle strings vs numbers
          const name = String(row[0] || 'Unknown');
          const len = parseFloat(row[1]);
          const wid = parseFloat(row[2]);
          const hgt = parseFloat(row[3]);

          if (!isNaN(len) && !isNaN(wid) && !isNaN(hgt)) {
            materials.push({
              id: `row-${i}`,
              name,
              length: len,
              width: wid,
              height: hgt
            });
          }
        }
        resolve(materials);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsBinaryString(file);
  });
};
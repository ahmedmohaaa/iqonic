// القوائم الكاملة للتخصصات حسب المرحلة والقسم
export const DISCIPLINE_LISTS = {
  CONCEPT: {
    ARCH: ['Sketch', 'Perspective'],
    ELEC: [],
    MECH: [],
    STRUCT: [],
  },
  DC1: {
    ARCH: [
      'Architecture',
      'Life Safety Plan/ LSP',
      'Roads/ Ashghal',
      'MOTC',
      'Civil Aviation/ CAV',
      'Qatar Rail',
      'Infrastructure Planning',
      'Urban Planning',
      'Higher Education/ MOEHE',
      'Technical Affairs/ Private Eng. Office',
      'Ministry of Environment& Climate Change/ MECC',
      'Ministry of Industry& Mineral Resources/ MIMR',
      'Qatar Tourism/ QTour',
      'Public Health/ MOPH',
      'General Cleanliness Project',
      'Livestock Department',
      'IFC matching coordination',
    ],
    ELEC: ['KAHRAMAA EL'],
    MECH: ['KAHRAMAA WS', 'Drainage'],
    STRUCT: ['Structural Design'],
  },
  DC2: {
    ARCH: ['Qatar Rail', 'MOTC'],
    ELEC: [
      'KAHRAMAA EL',
      'Telecom/ Ooredoo',
      'Fire Alarm/ MOI',
      'CCTV/ Security/ Client Specialist',
      'Earthing',
      'Lightning Protection',
      'Public Address',
      'Access Control',
    ],
    MECH: [
      'Water Supply',
      'Drainage(Storm, Sewerage)',
      'Fire Fighting/ MOI',
      'Ventilation/ MOI',
      'Air Conditioning',
      'Gas Supply',
      'SNG',
      'LPG',
      'Garbage Chute',
    ],
    STRUCT: ['Structural Review'],
  },
  TENDER: {
    ARCH: ['BOQ', 'Specifications', 'Conditions of contracts'],
    ELEC: [],
    MECH: [],
    STRUCT: [],
  },
};

// دالة مساعدة لجلب التخصصات حسب المرحلة والقسم
export const getDisciplinesByStageAndDepartment = (stage, department) => {
  return DISCIPLINE_LISTS[stage]?.[department] || [];
};

// دالة لجلب جميع التخصصات لمرحلة معينة
export const getAllDisciplinesByStage = (stage) => {
  const stageData = DISCIPLINE_LISTS[stage];
  if (!stageData) return [];
  
  return Object.entries(stageData).flatMap(([dept, disciplines]) =>
    disciplines.map(d => ({ name: d, department: dept }))
  );
};
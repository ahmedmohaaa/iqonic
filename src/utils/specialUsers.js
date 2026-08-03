// معالجة خاصة لـ Salman Saeed الذي يعمل في أكثر من قسم
export const SALMAN_SAEED_USERNAME = 'salman.saeed';

export const isSalmanSaeed = (username) => {
  return username === SALMAN_SAEED_USERNAME;
};

export const getEngineerDepartments = (engineer) => {
  // Salman Saeed يعمل في جميع الأقسام
  if (isSalmanSaeed(engineer.username)) {
    return ['Architecture', 'Mechanical', 'Electrical'];
  }
  return engineer.department ? [engineer.department] : [];
};

export const filterEngineersByDepartment = (engineers, department) => {
  return engineers.filter(eng => {
    const departments = getEngineerDepartments(eng);
    return departments.includes(department);
  });
};
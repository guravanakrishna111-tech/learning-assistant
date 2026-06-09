/**
 * Generate synthetic student data (same logic as Python version)
 */
export function generateStudentData(numStudents = 200) {
  const data = [];

  for (let i = 0; i < numStudents; i++) {
    const studyHours = Math.floor(Math.random() * 14) + 1;
    const sleepHours = Math.floor(Math.random() * 9) + 4;
    const previousScore = Math.floor(Math.random() * 51) + 50;
    const practiceTests = Math.floor(Math.random() * 9);

    let examScore = 3 * studyHours + 0.4 * previousScore + 1.5 * practiceTests;
    examScore += Math.floor(Math.random() * 11) - 5;
    examScore = Math.max(0, Math.min(100, examScore));

    data.push({
      studyHours,
      sleepHours,
      previousScore,
      practiceTests,
      examScore
    });
  }

  return data;
}

/**
 * Export data as CSV string
 */
export function exportAsCSV(data) {
  const headers = ['studyHours', 'sleepHours', 'previousScore', 'practiceTests', 'examScore'];
  const rows = data.map(row => headers.map(h => row[h]).join(','));
  return [headers.join(','), ...rows].join('\n');
}

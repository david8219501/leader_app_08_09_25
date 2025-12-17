// app/utils/scheduleTemplate.ts

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
}

interface WeekSchedule {
  [key: string]: {
    morning: string[];
    noon: string[];
    evening: string[];
  };
}

type ShiftType = 'morning' | 'noon' | 'evening';

export const generateScheduleHTML = (
  schedule: WeekSchedule,
  weekDates: string[],
  days: string[],
  showNoonShift: boolean,
  employees: Employee[],
): string => {
  const getEmployeeName = (id: string): string => {
    const emp = employees.find((e) => e.id === id);
    return emp ? `${emp.firstName} ${emp.lastName}` : '';
  };

  const shiftNames: Record<ShiftType, string> = { 
    morning: 'בוקר', 
    noon: 'צהריים', 
    evening: 'ערב' 
  };

  const renderCellContent = (day: string, shift: ShiftType): string => {
    const employeeIds = schedule[day]?.[shift] || [];
    if (employeeIds.length === 0) {
      return '<span style="color: #999;">-</span>';
    }
    return employeeIds
      .map((id) => getEmployeeName(id))
      .filter(name => name !== '')
      .join('<br/>');
  };

  const formatDate = (date: string): string => {
    // אם התאריך כבר כולל שנה, נחזיר אותו כמו שהוא
    const parts = date.split(/[./]/);
    if (parts.length === 3) {
      return date.replace(/\./g, '/');
    }
    // אם אין שנה, נוסיף את השנה הנוכחית
    const currentYear = new Date().getFullYear();
    return date.replace(/\./g, '/') + '/' + currentYear;
  };

  const renderShiftRow = (shift: ShiftType): string => `
    <tr class="shift-header">
      <th class="shift-label">${shiftNames[shift]}</th>
      ${days.map((day) => `<td>${renderCellContent(day, shift)}</td>`).join('')}
    </tr>
  `;

  return `
    <!DOCTYPE html>
    <html dir="rtl" lang="he">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>לוח משמרות - קריית אתא</title>
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Fredoka:wght@700&display=swap" rel="stylesheet">
      <style>
        @page {
          size: A4 landscape;
          margin: 10mm;
        }

        * {
          box-sizing: border-box;
        }

        html {
          height: 100%;
          width: 100%;
          margin: 0;
          padding: 0;
          background: linear-gradient(to bottom, #e3f3f4, #cddcee);
          background-attachment: fixed;
        }

        body { 
          font-family: 'Arial', 'Helvetica', sans-serif;
          direction: rtl; 
          margin: 0; 
          padding: 15px; 
          min-height: 100vh;
          width: 100%;
          display: flex; 
          flex-direction: column; 
          justify-content: center; 
          align-items: center; 
          background: transparent;
        }

        .header {
          text-align: center;
          margin-bottom: 25px; 
        }

        .subtitle {
          font-size: 60px;
          font-weight: 700;
          color: #2e6db8;
          margin-top: 10px;
          font-family: 'Fredoka', sans-serif;
        }

        .title-image {
          height: 75px;
          width: auto;
          margin-bottom: 15px;
          display: block;
          margin-left: auto;
          margin-right: auto;
        }

        .week-range {
          font-size: 20px;
          font-weight: bold;
          color: #2e6eb7;
          margin-top: 10px;
        }

        table { 
          width: 98%;
          border-collapse: collapse; 
          margin: 10px 0; 
          border: 2px solid #000;
          table-layout: fixed;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }

        th, td { 
          border: 2px solid #000; 
          text-align: center; 
          font-size: 16px;
          font-weight: bold;
          padding: 8px 5px;
          overflow: hidden;
          word-wrap: break-word;
        }

        th { 
          background-color: #2e6db8; 
          color: #fff; 
          font-weight: bold;
          height: 60px;
          font-size: 18px;
        }

        td {
          background-color: #fff;
          vertical-align: middle;
          height: 60px;
        }

        .logo-cell {
          background-color: #fff;
          padding: 5px;
          width: 100px;
          height: 100px;
        }

        .logo-cell img {
          width: 80px;
          height: 80px;
          object-fit: contain;
        }

        .shift-label {
          background-color: #2e6db8;
          color: #fff;
          font-weight: bold;
          width: 100px;
          height: 100px;
          font-size: 22px;
        }

        .shift-header td {
          line-height: 1.4;
          height: 100px;
        }

        @media print {
          @page {
            size: A4 landscape;
            margin: 8mm;
          }

          html, body {
            height: 100%;
            background: linear-gradient(to bottom, #e3f3f4, #cddcee) !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          body {
            padding: 10px;
            min-height: auto;
          }

          table {
            box-shadow: none;
            page-break-inside: avoid;
          }

          .header {
            page-break-inside: avoid;
            page-break-after: avoid;
          }
        }

        @media screen and (max-width: 1024px) {
          body {
            padding: 10px;
          }

          .subtitle {
            font-size: 40px;
          }

          th, td {
            font-size: 12px;
            padding: 6px 3px;
          }

          .title-image {
            height: 60px;
          }

          .shift-label {
            font-size: 16px;
          }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <img 
          src="https://leaderkids.co.il/wp-content/uploads/2022/09/leaderLogo.svg" 
          alt="לוגו לידר קידס" 
          class="title-image" 
          onerror="this.style.display='none'"
        />
        <div class="subtitle">קריית אתא</div>
      </div>

      <table>
        <thead>
          <tr>
            <th class="logo-cell">
              <img src="https://leaderkids.co.il/wp-content/uploads/2022/09/leaderLogo.svg" />
            </th>
            ${days.map((day, index) => `
              <th>${day}<br/>${formatDate(weekDates[index])}</th>
            `).join('')}
          </tr>
        </thead>
        <tbody>
          ${renderShiftRow('morning')}
          ${showNoonShift ? renderShiftRow('noon') : ''}
          ${renderShiftRow('evening')}
        </tbody>
      </table>
    </body>
    </html>
  `;
};

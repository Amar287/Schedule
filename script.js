document.addEventListener('DOMContentLoaded', function() {
    const days = ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const timeOptions = Array.from({ length: 48 }, (_, i) => {
        const hours = Math.floor(i / 2);
        const minutes = i % 2 === 0 ? '00' : '30';
        const period = hours >= 12 ? 'PM' : 'AM';
        const hour12 = hours % 12 || 12; // Convert 0 to 12 for 12-hour format
        return `${String(hour12).padStart(2, '0')}:${minutes} ${period}`;
    });

    const busyTimesContainer = document.getElementById('busyTimesContainer');

    days.forEach(day => {
        const busyTimeDiv = document.createElement('div');
        busyTimeDiv.className = 'busy-time';

        const label = document.createElement('label');
        label.textContent = `${day}:`;
        busyTimeDiv.appendChild(label);

        const startSelect = document.createElement('select');
        startSelect.name = `busyTimes[${day}][start]`;
        timeOptions.forEach(time => {
            const option = document.createElement('option');
            option.value = time;
            option.textContent = time;
            startSelect.appendChild(option);
        });
        busyTimeDiv.appendChild(startSelect);

        const span = document.createElement('span');
        span.textContent = 'إلى';
        busyTimeDiv.appendChild(span);

        const endSelect = document.createElement('select');
        endSelect.name = `busyTimes[${day}][end]`;
        timeOptions.forEach(time => {
            const option = document.createElement('option');
            option.value = time;
            option.textContent = time;
            endSelect.appendChild(option);
        });
        busyTimeDiv.appendChild(endSelect);

        busyTimesContainer.appendChild(busyTimeDiv);
    });

    document.getElementById('scheduleForm').addEventListener('submit', function(event) {
        event.preventDefault();

        const formData = new FormData(event.target);
        const days = formData.getAll('days');
        const subjects = formData.getAll('subjects');
        const busyTimes = {};
        const studyDuration = parseInt(formData.get('studyDuration'), 10) || 90;
        const subjectsPerDay = parseInt(formData.get('subjectsPerDay'), 10) || 2;

        days.forEach(day => {
            busyTimes[day] = {
                start: formData.get(`busyTimes[${day}][start]`),
                end: formData.get(`busyTimes[${day}][end]`)
            };
        });

        let schedule = {};

        days.forEach(day => {
            let currentTime = new Date("2023-01-01T14:00:00");
            schedule[day] = {};

            const shuffledSubjects = shuffleArray(subjects);

            for (let i = 0; i < subjectsPerDay; i++) {
                const subject = shuffledSubjects[i % subjects.length];

                if (busyTimes[day] && busyTimes[day].start && busyTimes[day].end) {
                    const busyStartTime = new Date(`2023-01-01T${busyTimes[day].start}`);
                    const busyEndTime = new Date(`2023-01-01T${busyTimes[day].end}`);

                    if (currentTime >= busyStartTime && currentTime < busyEndTime) {
                        currentTime = busyEndTime;
                    }
                }

                const endTime = new Date(currentTime.getTime() + studyDuration * 60000);
                const sessionTime = `${currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
                schedule[day][subject] = sessionTime;
                currentTime = endTime;
            }
        });

        displaySchedule(schedule, days, subjects);
    });

    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    function displaySchedule(schedule, days, subjects) {
        const scheduleTable = document.createElement('table');
        const headerRow = scheduleTable.insertRow();
        const emptyHeader = headerRow.insertCell(0);
        emptyHeader.textContent = '';

        days.forEach(day => {
            const dayHeader = headerRow.insertCell();
            dayHeader.textContent = day;
        });

        subjects.forEach((subject, subjectIndex) => {
            const row = scheduleTable.insertRow();
            const subjectHeader = row.insertCell(0);
            subjectHeader.textContent = subject;

            days.forEach((day, dayIndex) => {
                const cell = row.insertCell();
                cell.textContent = schedule[day][subject] || '-';
            });
        });

        const downloadButtons = document.createElement('div');
        downloadButtons.innerHTML = `
            <button id="downloadPDF">تنزيل PDF</button>
            <button id="downloadXLSX">تنزيل XLSX</button>
        `;

        document.body.appendChild(scheduleTable);
        document.body.appendChild(downloadButtons);

        document.getElementById('downloadPDF').addEventListener('click', function() {
            downloadTableAsPDF(scheduleTable);
        });

        document.getElementById('downloadXLSX').addEventListener('click', function() {
            downloadTableAsXLSX(scheduleTable);
        });
    }

    function downloadTableAsPDF(table) {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        const columns = Array.from(table.rows[0].cells).map(cell => cell.textContent);
        const rows = [];

        for (let i = 1; i < table.rows.length; i++) {
            const row = Array.from(table.rows[i].cells).map(cell => cell.textContent);
            rows.push(row);
        }

        doc.autoTable({
            head: [columns],
            body: rows,
            startY: 20,
            styles: { fontSize: 10 }
        });

        doc.save('schedule.pdf');
    }

    function downloadTableAsXLSX(table) {
        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.table_to_sheet(table);

        // Set column widths
        const colWidths = Array.from({ length: table.rows[0].cells.length }, () => ({ wch: 20 }));
        worksheet['!cols'] = colWidths;

        XLSX.utils.book_append_sheet(workbook, worksheet, 'Schedule');
        XLSX.writeFile(workbook, 'schedule.xlsx');
    }
});

async function searchStudent(event) {
    event.preventDefault();
    const name = document.getElementById('studentName').value;

    try {
        const response = await fetch('http://localhost:3000/find-student', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name })
        });

        if (response.status === 404) {
            alert("Cannot find the student.");
            return;
        }

        if (!response.ok) {
            alert("An error occurred while searching for the student.");
            return;
        }

        const student = await response.json();
        document.getElementById('resultTable').innerHTML = `
            <tr>
                <td>${student.name}</td>
                <td>${student.id}</td>
                <td>${student.phone}</td>
                <td>${student.zip}</td>
                <td><button type="button" onclick="deleteStudent('${encodeURIComponent(student.name)}')">Delete</button></td>
            </tr>
        `;
    } catch (error) {
        console.error("Error:", error);
        alert("An error occurred while searching for the student.");
    }
}

async function deleteStudent(encodedName) {
    const name = decodeURIComponent(encodedName);

    if (!confirm(`Delete student ${name}?`)) {
        return;
    }

    try {
        const response = await fetch('http://localhost:3000/delete-student', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name })
        });

        if (response.status === 404) {
            alert("Student not found or already deleted.");
            return;
        }

        if (!response.ok) {
            const error = await response.json();
            alert(`Error: ${error.error}`);
            return;
        }

        alert("Student deleted successfully.");
        document.getElementById('resultTable').innerHTML = '';
    } catch (error) {
        console.error("Error:", error);
        alert("An error occurred while deleting the student.");
    }
}

async function addStudent(event) {
    event.preventDefault();
    const name = document.getElementById('addName').value;
    const id = document.getElementById('addId').value;
    const phone = document.getElementById('addPhone').value;
    const zip = document.getElementById('addZip').value;

    try {
        const response = await fetch('http://localhost:3000/add-student', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name, id, phone, zip })
        });

        if (!response.ok) {
            const error = await response.json();
            alert(`Error: ${error.error}`);
            return;
        }

        alert("Student added successfully!");
        document.querySelector('form[onsubmit="addStudent(event)"]').reset();
    } catch (error) {
        console.error("Error:", error);
        alert("An error occurred while adding the student.");
    }
}

// --- COURSE MANAGEMENT FUNCTIONS ---

async function addCourse(event) {
    event.preventDefault(); 

    const classId = document.getElementById('classId').value;
    const className = document.getElementById('className').value;

    try {
        const response = await fetch('http://localhost:3000/courses', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ classId: classId, className: className })
        });

        if (response.ok) {
            alert('Course added successfully!');
            event.target.reset(); 
            listCourses(); 
        } else {
            alert('Failed to add course. Check server logs.');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred connecting to the server.');
    }
}

async function listCourses() {
    try {
        const response = await fetch('http://localhost:3000/courses');
        
        if (!response.ok) {
            alert('Failed to fetch courses.');
            return;
        }

        const courses = await response.json();
        const tbody = document.getElementById('coursesTableBody');

        tbody.innerHTML = ''; 

        courses.forEach(course => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td style="padding: 5px;">${course.classId}</td>
                <td style="padding: 5px;">${course.className}</td>
                <td style="padding: 5px;">
                    <button onclick="deleteCourse('${course.classId}')">Delete</button>
                </td>
            `;
            tbody.appendChild(row);
        });

    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred while fetching the courses.');
    }
}

async function deleteCourse(classId) {
    if (!confirm(`Are you sure you want to delete course ${classId}?`)) {
        return;
    }

    try {
        const response = await fetch('http://localhost:3000/delete-course', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ classId })
        });

        if (response.ok) {
            alert('Course deleted successfully!');
            listCourses(); 
        } else {
            const error = await response.json();
            alert(`Failed to delete course: ${error.error}`);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred connecting to the server.');
    }
}


document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('studentSelect') && document.getElementById('courseSelect')) {
        populateDropdowns();
    }
});

async function populateDropdowns() {
    try {
        // Fetch and format Students
        const studentRes = await fetch('http://localhost:3000/students');
        const students = await studentRes.json();
        const studentSelect = document.getElementById('studentSelect');
        
        students.forEach(student => {
            const option = document.createElement('option');
            option.value = student.id;
            option.textContent = `${student.name} (${student.id})`;
            studentSelect.appendChild(option);
        });

        // Fetch and format Courses
        const courseRes = await fetch('http://localhost:3000/courses');
        const courses = await courseRes.json();
        const courseSelect = document.getElementById('courseSelect');
        
        courses.forEach(course => {
            const option = document.createElement('option');
            option.value = course.classId;
            option.textContent = `${course.className} (${course.classId})`;
            courseSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Error populating dropdowns:', error);
    }
}

async function enrollStudent(event) {
    event.preventDefault();

    const studentId = document.getElementById('studentSelect').value;
    const classId = document.getElementById('courseSelect').value;

    try {
        const response = await fetch('http://localhost:3000/enrollments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ studentId, classId })
        });

        if (response.ok) {
            alert('Student enrolled successfully!');
            event.target.reset(); 
        } else {
            const error = await response.json();
            alert(`Failed to enroll: ${error.error}`);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred connecting to the server.');
    }
}
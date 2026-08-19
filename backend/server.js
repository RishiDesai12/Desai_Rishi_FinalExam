const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

const DATA_FILE = path.join(__dirname, 'students.json');
const COURSE_FILE = path.join(__dirname, 'courses.json');
const ENROLLMENT_FILE = path.join(__dirname, 'enrollments.json');

// --- STUDENT HELPER FUNCTIONS ---
async function loadStudents() {
    try {
        const data = await fs.promises.readFile(DATA_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') {
            return [];
        }
        console.error('Error reading students file:', error);
        return [];
    }
}

async function saveStudents(students) {
    try {
        await fs.promises.writeFile(DATA_FILE, JSON.stringify(students, null, 2), 'utf8');
    } catch (error) {
        console.error('Error writing students file:', error);
        throw error;
    }
}

// --- COURSE HELPER FUNCTIONS ---
async function loadCourses() {
    try {
        const data = await fs.promises.readFile(COURSE_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') {
            return []; 
        }
        console.error('Error reading courses file:', error);
        return [];
    }
}

async function saveCourses(courses) {
    try {
        await fs.promises.writeFile(COURSE_FILE, JSON.stringify(courses, null, 2), 'utf8');
    } catch (error) {
        console.error('Error writing courses file:', error);
        throw error;
    }
}

// --- ENROLLMENT HELPER FUNCTIONS ---
async function loadEnrollments() {
    try {
        const data = await fs.promises.readFile(ENROLLMENT_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') return [];
        console.error('Error reading enrollments file:', error);
        return [];
    }
}

async function saveEnrollments(enrollments) {
    try {
        await fs.promises.writeFile(ENROLLMENT_FILE, JSON.stringify(enrollments, null, 2), 'utf8');
    } catch (error) {
        console.error('Error writing enrollments file:', error);
        throw error;
    }
}

// --- STUDENT ROUTES ---
app.post('/find-student', async (req, res) => {
    try {
        const { name } = req.body;
        if (!name) {
            return res.status(400).send({ error: 'Student name is required' });
        }

        const students = await loadStudents();
        const student = students.find((item) => item.name === name);
        if (!student) {
            return res.status(404).send({ error: 'Student not found' });
        }

        res.send(student);
    } catch (error) {
        console.error('Error finding student:', error);
        res.status(500).send({ error: 'Internal server error' });
    }
});

app.post('/add-student', async (req, res) => {
    try {
        const { name, id, phone, zip } = req.body;
        if (!name || !id || !phone || !zip) {
            return res.status(400).send({ error: 'All fields (name, id, phone, zip) are required' });
        }

        const students = await loadStudents();
        const newStudent = { name, id, phone, zip };
        students.push(newStudent);
        await saveStudents(students);

        res.status(201).send({ message: 'Student added successfully', student: newStudent });
    } catch (error) {
        console.error('Error adding student:', error);
        res.status(500).send({ error: 'Internal server error' });
    }
});

app.post('/delete-student', async (req, res) => {
    try {
        const { name } = req.body;
        if (!name) {
            return res.status(400).send({ error: 'Student name is required' });
        }

        const students = await loadStudents();
        const index = students.findIndex((item) => item.name === name);
        if (index === -1) {
            return res.status(404).send({ error: 'Student not found' });
        }

        const deletedStudent = students.splice(index, 1)[0];
        await saveStudents(students);

        // Cascade delete student enrollments
        const enrollments = await loadEnrollments();
        const updatedEnrollments = enrollments.filter(e => e.studentId !== deletedStudent.id);
        await saveEnrollments(updatedEnrollments);

        res.send({ message: 'Student deleted successfully', student: deletedStudent });
    } catch (error) {
        console.error('Error deleting student:', error);
        res.status(500).send({ error: 'Internal server error' });
    }
});

app.get('/students', async (req, res) => {
    try {
        const students = await loadStudents();
        res.status(200).send(students);
    } catch (error) {
        console.error('Error fetching students:', error);
        res.status(500).send({ error: 'Internal server error' });
    }
});

app.post('/courses', async (req, res) => {
    try {
        const { classId, className } = req.body;
        if (!classId || !className) {
            return res.status(400).send({ error: 'Class ID and Class Name are required' });
        }

        const courses = await loadCourses();
        const newCourse = { classId, className };
        courses.push(newCourse);
        await saveCourses(courses);

        res.status(201).send({ message: 'Course added successfully', course: newCourse });
    } catch (error) {
        console.error('Error adding course:', error);
        res.status(500).send({ error: 'Internal server error' });
    }
});

app.get('/courses', async (req, res) => {
    try {
        const courses = await loadCourses();
        res.status(200).send(courses);
    } catch (error) {
        console.error('Error fetching courses:', error);
        res.status(500).send({ error: 'Internal server error' });
    }
});

app.post('/delete-course', async (req, res) => {
    try {
        const { classId } = req.body;
        if (!classId) {
            return res.status(400).send({ error: 'Class ID is required' });
        }

        const courses = await loadCourses();
        const index = courses.findIndex((item) => item.classId === classId);
        
        if (index === -1) {
            return res.status(404).send({ error: 'Course not found' });
        }

        const deletedCourse = courses.splice(index, 1)[0];
        await saveCourses(courses);

        // Cascade delete course enrollments
        const enrollments = await loadEnrollments();
        const updatedEnrollments = enrollments.filter(e => e.classId !== classId);
        await saveEnrollments(updatedEnrollments);

        res.send({ message: 'Course deleted successfully', course: deletedCourse });
    } catch (error) {
        console.error('Error deleting course:', error);
        res.status(500).send({ error: 'Internal server error' });
    }
});

// --- ENROLLMENT ROUTES ---
app.post('/enrollments', async (req, res) => {
    try {
        const { studentId, classId } = req.body;
        if (!studentId || !classId) {
            return res.status(400).send({ error: 'Student ID and Class ID are required' });
        }

        const enrollments = await loadEnrollments();
        const newEnrollment = { studentId, classId };
        enrollments.push(newEnrollment);
        await saveEnrollments(enrollments);

        res.status(201).send({ message: 'Enrollment successful!', enrollment: newEnrollment });
    } catch (error) {
        console.error('Error adding enrollment:', error);
        res.status(500).send({ error: 'Internal server error' });
    }
});

app.get('/course-students/:classId', async (req, res) => {
    try {
        const classId = req.params.classId;
        
        const enrollments = await loadEnrollments();
        const students = await loadStudents();

        const enrolledStudentIds = enrollments
            .filter(e => e.classId === classId)
            .map(e => e.studentId);

        const enrolledStudents = students.filter(student => 
            enrolledStudentIds.includes(student.id)
        );

        res.status(200).send(enrolledStudents);
    } catch (error) {
        console.error('Error fetching enrolled students:', error);
        res.status(500).send({ error: 'Internal server error' });
    }
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
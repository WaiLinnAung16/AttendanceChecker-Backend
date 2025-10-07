import Subject from "../models/subject.model.js";
import User from "../models/user.model.js";

const getSubjects = async (req, res) => {
  try {
    const { code, userId } = req.query;
    if (!code && !userId) {
      const subjects = await Subject.find({})
        .populate("assign_teacher", "name email")
        .populate("students", "name email");
      res.status(200).json(subjects);
    } else if (code) {
      const subject = await Subject.findOne({ code });
      if (!subject) {
        return res.status(404).json({ message: "Subject Not Found" });
      }
      res.status(200).json([subject]);
    } else if (userId) {
      const user = await User.findById(userId).populate("subjects");
      if (!user) {
        return res.status(404).json({ message: "User Not Found" });
      }
      res.status(200).json(user.subjects);
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getSingleSubject = async (req, res) => {
  try {
    const { id } = req.params;
    const subject = await Subject.findById(id).populate(
      "assign_teacher",
      "name email"
    );
    res.status(200).json(subject);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createSubject = async (req, res) => {
  try {
    const { title, description, assign_teacher } = req.body;

    // Generate a unique code with 5 characters (letters and numbers)
    function generateCode(length = 5) {
      const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
      let result = "";
      for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return result;
    }

    // Ensure code is unique in the database
    async function getUniqueCode() {
      let code;
      let exists = true;
      while (exists) {
        code = generateCode();
        exists = await Subject.findOne({ code });
      }
      return code;
    }

    const code = await getUniqueCode();

    const subject = await Subject.create({
      title,
      description,
      assign_teacher,
      code,
    });
    res.status(200).json(subject);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateSubject = async (req, res) => {
  try {
    const { id } = req.params;
    const { assign_teacher } = req.body;

    const user = await User.findById(assign_teacher);

    if (!user) {
      return res.status(404).json({ message: "User doesn't exit" });
    }

    const updatedSubjects = user.subjects.push(id);
    await User.findByIdAndUpdate(assign_teacher, {
      ...user,
      subjects: updatedSubjects,
    });
    const subject = await Subject.findByIdAndUpdate(id, req.body);

    if (!subject) {
      return res.status(404).json({ message: "Subject not found" });
    }

    const updatedSubject = await Subject.findById(id);
    res.status(200).json(updatedSubject);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteSubject = async (req, res) => {
  try {
    const { id } = req.params;
    const subject = await Subject.findByIdAndDelete(id);
    if (!subject) {
      return res.status(404).json({ message: "Subject not found" });
    }
    res.status(200).json({ message: "Subject Deleted", id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const joinSubject = async (req, res) => {
  try {
    const { id } = req.params;
    const { student_id } = req.body;

    const student = await User.findById(student_id);
    if (!student) {
      return res.status(404).json({ message: "Student Not Found" });
    }
    const updatedSubjects = student.subjects.push(id);
    await User.findByIdAndUpdate(student_id, {
      ...student,
      subjects: updatedSubjects,
    });

    const subject = await Subject.findById(id);
    const updatedStudents = subject.students.push(student_id);
    const updatatedSubject = await Subject.findByIdAndUpdate(id, {
      ...subject,
      students: updatedStudents,
    });

    res
      .status(200)
      .json({ message: "Student Joined Successfully", data: updatatedSubject });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export {
  getSubjects,
  getSingleSubject,
  updateSubject,
  deleteSubject,
  createSubject,
  joinSubject,
};

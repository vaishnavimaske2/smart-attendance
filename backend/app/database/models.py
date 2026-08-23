from datetime import datetime

from sqlalchemy import (
    Column,
    Integer,
    String,
    Boolean,
    Date,
    DateTime,
    ForeignKey,
    JSON
)

from sqlalchemy.orm import relationship

from app.database.database import Base


# ============================================================
# SCHOOL
# ============================================================

class School(Base):

    __tablename__ = "schools"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    name = Column(
        String(150),
        nullable=False
    )

    school_code = Column(
        String(50),
        unique=True,
        nullable=False
    )

    location = Column(
        String(200),
        nullable=True
    )

    users = relationship(
        "User",
        back_populates="school"
    )


# ============================================================
# USER
# ============================================================

class User(Base):

    __tablename__ = "users"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    school_id = Column(
        Integer,
        ForeignKey("schools.id"),
        nullable=False
    )

    name = Column(
        String(150),
        nullable=False
    )

    email = Column(
        String(150),
        unique=True,
        nullable=False
    )

    password_hash = Column(
        String(255),
        nullable=False
    )

    role = Column(
        String(20),
        nullable=False
    )

    is_active = Column(
        Boolean,
        default=True
    )

    school = relationship(
        "School",
        back_populates="users"
    )


# ============================================================
# CLASS
# ============================================================

class Class(Base):

    __tablename__ = "classes"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    school_id = Column(
        Integer,
        ForeignKey("schools.id"),
        nullable=False
    )

    name = Column(
        String(50),
        nullable=False
    )

    section = Column(
        String(10),
        nullable=False
    )

    academic_year = Column(
        String(20),
        nullable=False
    )


# ============================================================
# SUBJECT
# ============================================================

class Subject(Base):
    __tablename__ = "subjects"

    id = Column(Integer, primary_key=True, index=True)

    school_id = Column(
        Integer,
        ForeignKey("schools.id"),
        nullable=False
    )

    name = Column(
        String(100),
        nullable=False
    )
    
    code = Column(
        String(30),
        nullable=False
    )

    is_active = Column(
        Boolean,
        default=True
    )

class ClassSubject(Base):
    __tablename__ = "class_subjects"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    class_id = Column(
        Integer,
        ForeignKey("classes.id"),
        nullable=False
    )

    subject_id = Column(
        Integer,
        ForeignKey("subjects.id"),
        nullable=False
    )

    is_active = Column(
        Boolean,
        default=True
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )
    
class TeacherAssignment(Base):
    __tablename__ = "teacher_assignments"

    id = Column(Integer, primary_key=True, index=True)

    teacher_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False
    )

    class_id = Column(
        Integer,
        ForeignKey("classes.id"),
        nullable=False
    )

    subject_id = Column(
        Integer,
        ForeignKey("subjects.id"),
        nullable=True
    )

    is_class_teacher = Column(
        Boolean,
        default=False,
        nullable=False
    )

    is_active = Column(
        Boolean,
        default=True
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )


# ============================================================
# STUDENT
# ============================================================

class Student(Base):

    __tablename__ = "students"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    school_id = Column(
        Integer,
        ForeignKey("schools.id"),
        nullable=False
    )

    class_id = Column(
        Integer,
        ForeignKey("classes.id"),
        nullable=False
    )
    
    name = Column(
        String(150),
        nullable=False
    )

    roll_number = Column(
        String(50),
        nullable=False
    )

    date_of_birth = Column(
        Date,
        nullable=True
    )

    gender = Column(
        String(20),
        nullable=True
    )

    section = Column(
        String(10),
        nullable=True
    )

    is_active = Column(
        Boolean,
        default=True
    )

    # Face recognition embedding
    face_embedding = Column(
        JSON,
        nullable=True
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )


# ============================================================
# ATTENDANCE
# ============================================================

class Attendance(Base):

    __tablename__ = "attendance"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    school_id = Column(
        Integer,
        ForeignKey("schools.id"),
        nullable=False
    )

    class_id = Column(
        Integer,
        ForeignKey("classes.id"),
        nullable=False
    )
    
    subject_id = Column(
        Integer,
        ForeignKey("subjects.id"),
        nullable=True
    )

    student_id = Column(
        Integer,
        ForeignKey("students.id"),
        nullable=False
    )

    marked_by = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False
    )

    attendance_date = Column(
        Date,
        nullable=False
    )

    status = Column(
        String(20),
        nullable=False
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )


# ============================================================
# STUDENT FACE
# ============================================================

class StudentFace(Base):

    __tablename__ = "student_faces"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    student_id = Column(
        Integer,
        ForeignKey("students.id"),
        nullable=False
    )

    embedding = Column(
        String,
        nullable=False
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )
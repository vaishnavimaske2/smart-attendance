from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os;
from app.database.database import Base, engine
from app.database.models import School, User, Class, Student, Attendance, StudentFace
from app.routes.school import router as school_router
from app.routes.auth import router as auth_router
from app.routes.classes import router as class_router
from app.routes.teachers import router as teacher_router
from app.routes.students import router as student_router
from app.routes.teacher_assignments import router as teacher_assignment_router
from app.routes.attendance import router as attendance_router
from app.routes.faces import router as face_router
from app.routes.recognition import router as recognition_router
from app.routes.attendance_report import router as attendance_report_router
from app.routes.subjects import router as subjects_router
from app.routes.class_subjects import router as class_subjects_router
from app.routes.class_teachers import router as class_teachers_router
from app.routes.teacher_profile import router as teacher_profile_router
from app.routes.student_profile import router as student_profile_router
from app.routes.teacher_students import router as teacher_students_router
from app.routes.dashboard import router as dashboard_router
from app.routes.admin_dashboard import router as admin_dashboard_router
from app.routes.admin_students import router as admin_students_router
from app.routes.attendance_excel import router as attendance_excel_router
from app.routes.admin_reports import router as admin_reports_router

Base.metadata.create_all(bind=engine)


app = FastAPI(
    title="SmartAttend API",
    description="Automated Student Attendance System",
    version="1.0.0"
)

# ============================================================
# CORS
# ============================================================

origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://10.253.103.180:5173",
]


app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(school_router)
app.include_router(auth_router)
app.include_router(class_router)
app.include_router(teacher_router)
app.include_router(student_router)
app.include_router(subjects_router)
app.include_router(class_teachers_router)
app.include_router(teacher_profile_router)
app.include_router(student_profile_router)
app.include_router(teacher_assignment_router)
app.include_router(class_subjects_router)
app.include_router(attendance_router)
app.include_router(face_router)
app.include_router(recognition_router)
app.include_router(attendance_report_router)
app.include_router(teacher_students_router)
app.include_router(dashboard_router)
app.include_router(admin_dashboard_router)
app.include_router(admin_students_router)
app.include_router(attendance_excel_router)
app.include_router(admin_reports_router)

@app.get("/")
def root():
    return {
        "message": "SmartAttend API is running!"
    }
from flask import Blueprint, render_template

routine_bp = Blueprint('routine', __name__)

@routine_bp.route('/routine')
def routine_home():
   
    students_list = [
        {"id": "23101411", "name": "Sal Sabila Huq", "status": "Present"},
        {"id": "23101412", "name": "Mredul Islam", "status": "Present"},
        {"id": "23101413", "name": "Tanvir Ahmed", "status": "Absent"},
        {"id": "23101414", "name": "Ayesha Rahman", "status": "Present"},
        {"id": "23101415", "name": "Naimul Hasan", "status": "Absent"}
    ]
    return render_template('routine_attendance.html', students=students_list)
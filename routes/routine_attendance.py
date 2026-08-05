from flask import Blueprint, render_template

routine_bp = Blueprint('routine', __name__)

@routine_bp.route('/routine')
def routine_page():
    return render_template('routine_attendance.html')
from flask import Flask
from routes.routine_attendance import routine_bp

app = Flask(__name__)


app.register_blueprint(routine_bp)

if __name__ == '__main__':
    app.run(debug=True)
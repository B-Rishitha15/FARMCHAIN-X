from flask import Flask, request, jsonify
import sqlite3
import traceback
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM
import torch

app = Flask(__name__)
DB = "farm.db"

# -----------------------------
# Initialize & Seed Data
# -----------------------------
def init_db_and_seed():
    conn = sqlite3.connect(DB)
    cur = conn.cursor()

    cur.executescript("""
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        location TEXT,
        contact TEXT
    );

    CREATE TABLE IF NOT EXISTS crops (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        season TEXT,
        fertilizer TEXT,
        water_requirement TEXT
    );

    CREATE TABLE IF NOT EXISTS faq (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        question TEXT NOT NULL,
        answer TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS harvest_info (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        crop_name TEXT NOT NULL,
        harvest_date TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS suppliers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        crop_name TEXT NOT NULL,
        supplier_name TEXT NOT NULL,
        location TEXT,
        contact TEXT
    );

    CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        crop_name TEXT,
        status TEXT,
        details TEXT
    );
    """)

    # Seed crops
    cur.execute("SELECT COUNT(*) FROM crops")
    if cur.fetchone()[0] == 0:
        cur.executemany("""
        INSERT INTO crops(name,season,fertilizer,water_requirement)
        VALUES(?,?,?,?)
        """, [
            ("Tomato", "Summer", "NPK 20-20-20", "Medium"),
            ("Potato", "Spring", "NPK 10-52-10", "Moderate"),
            ("Carrot", "Autumn", "Balanced NPK", "Low"),
        ])

    # Seed harvest data
    cur.execute("SELECT COUNT(*) FROM harvest_info")
    if cur.fetchone()[0] == 0:
        cur.executemany("""
        INSERT INTO harvest_info(crop_name,harvest_date) VALUES(?,?)
        """, [
            ("Tomato", "2025-03-15"),
            ("Potato", "2025-02-10"),
            ("Carrot", "2025-01-25"),
        ])

    # Seed suppliers
    cur.execute("SELECT COUNT(*) FROM suppliers")
    if cur.fetchone()[0] == 0:
        cur.executemany("""
        INSERT INTO suppliers(crop_name,supplier_name,location,contact)
        VALUES(?,?,?,?)
        """, [
            ("Tomato", "GreenGrow Supplies", "Hyderabad", "9123456789"),
            ("Potato", "AgriFarm Traders", "Guntur", "9876543212"),
            ("Carrot", "FreshField Supply Co.", "Vizag", "9988776655"),
        ])

    # Seed FAQ
    cur.execute("SELECT COUNT(*) FROM faq")
    if cur.fetchone()[0] == 0:
        cur.executemany("""
        INSERT INTO faq(question,answer) VALUES(?,?)
        """, [
            ("what is crop rotation", "Crop rotation improves soil health by changing crops each season."),
            ("how to store tomatoes", "Store tomatoes at room temperature away from sunlight.")
        ])

    # Seed transactions
    cur.execute("SELECT COUNT(*) FROM transactions")
    if cur.fetchone()[0] == 0:
        cur.executemany("""
        INSERT INTO transactions(crop_name,status,details) VALUES(?,?,?)
        """, [
            ("Tomato", "pending", "Order #101"),
            ("Carrot", "completed", "Order #99"),
            ("Potato", "pending", "Order #102"),
            ("Tomato", "completed", "Order #98"),
        ])

    conn.commit()
    conn.close()

# -----------------------------
# DB Helper
# -----------------------------
def db_query(q, params=()):
    try:
        conn = sqlite3.connect(DB)
        conn.row_factory = sqlite3.Row
        cur = conn.cursor()
        cur.execute(q, params)
        rows = cur.fetchall()
        conn.close()
        return [dict(x) for x in rows]
    except Exception as e:
        print("[DB ERROR]", e)
        return []

# -----------------------------
# Flan-T5-large Setup
# -----------------------------
print("Loading google/flan-t5-large model... This may take some time.")
tokenizer = AutoTokenizer.from_pretrained("google/flan-t5-large")
model = AutoModelForSeq2SeqLM.from_pretrained("google/flan-t5-large")
print("Model loaded successfully!")

def ask_flan_t5(question):
    try:
        input_text = "Answer in detail: " + question
        inputs = tokenizer(input_text, return_tensors="pt")
        outputs = model.generate(**inputs, max_length=300)
        reply = tokenizer.decode(outputs[0], skip_special_tokens=True)
        return reply
    except Exception as e:
        print("[AI ERROR]", e)
        return "Sorry, I could not generate a response at this time."

# -----------------------------
# Chat Route
# -----------------------------
@app.route("/chat", methods=["POST"])
def chat():
    try:
        payload = request.get_json(force=True)
    except Exception:
        return jsonify({"reply": "Invalid JSON input"}), 400

    if not payload:
        return jsonify({"reply": "Send JSON like {\"question\":\"...\"}"}), 400

    question = payload.get("question", "")
    if not isinstance(question, str) or not question.strip():
        return jsonify({"reply": "Question cannot be empty"}), 400

    ql = question.lower().strip()

    # detect crop
    crops_list = db_query("SELECT name FROM crops")
    crop_names = [c["name"].lower() for c in crops_list]
    crop = None
    for c in crop_names:
        if c in ql:
            crop = c
            break

    # CROP BASED RESPONSES
    if crop:
        if "season" in ql or "grow" in ql:
            r = db_query("SELECT season FROM crops WHERE lower(name)=?", (crop,))
            return jsonify({"reply": f"{crop.title()} grows in {r[0]['season']} season."})

        if "fertilizer" in ql:
            r = db_query("SELECT fertilizer FROM crops WHERE lower(name)=?", (crop,))
            return jsonify({"reply": f"Best fertilizer for {crop.title()} is {r[0]['fertilizer']}."})

        if "water" in ql or "irrigation" in ql:
            r = db_query("SELECT water_requirement FROM crops WHERE lower(name)=?", (crop,))
            return jsonify({"reply": f"{crop.title()} needs {r[0]['water_requirement']} water."})

        if "harvest" in ql or "date" in ql:
            r = db_query("SELECT harvest_date FROM harvest_info WHERE lower(crop_name)=?", (crop,))
            return jsonify({"reply": f"Harvest date for {crop.title()} is {r[0]['harvest_date']}."})

        if "supplier" in ql or "vendor" in ql or "buy" in ql:
            r = db_query("SELECT supplier_name, location, contact FROM suppliers WHERE lower(crop_name)=?", (crop,))
            s = r[0]
            return jsonify({"reply": f"Supplier: {s['supplier_name']}, Location: {s['location']}, Contact: {s['contact']}."})

        if "info" in ql or "tell me" in ql:
            r = db_query("SELECT season,fertilizer,water_requirement FROM crops WHERE lower(name)=?", (crop,))
            rec = r[0]
            return jsonify({"reply": f"{crop.title()} — Season: {rec['season']}, Fertilizer: {rec['fertilizer']}, Water: {rec['water_requirement']}."})

    # Transactions
    if "transaction" in ql or "pending" in ql or "completed" in ql:
        if "pending" in ql:
            r = db_query("SELECT COUNT(*) AS c FROM transactions WHERE status='pending'")
            return jsonify({"reply": f"{r[0]['c']} pending transactions."})
        if "completed" in ql:
            r = db_query("SELECT COUNT(*) AS c FROM transactions WHERE status='completed'")
            return jsonify({"reply": f"{r[0]['c']} completed transactions."})
        r = db_query("SELECT COUNT(*) AS c FROM transactions")
        return jsonify({"reply": f"Total transactions: {r[0]['c']}"})

    # FAQ
    faq = db_query("SELECT answer FROM faq WHERE lower(question)=?", (ql,))
    if faq:
        return jsonify({"reply": faq[0]["answer"]})

    # Fallback to Flan-T5 for general questions
    reply = ask_flan_t5(question)
    return jsonify({"reply": reply})

# -----------------------------
# Start
# -----------------------------
if __name__ == "__main__":
    init_db_and_seed()
    app.run(debug=True)

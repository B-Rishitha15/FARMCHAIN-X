import sqlite3

def insert_sample_data():
    conn = sqlite3.connect("farm_data.db")
    cursor = conn.cursor()

    # Sample users
    cursor.executemany("""
        INSERT INTO users (name, location, contact)
        VALUES (?, ?, ?)
    """, [
        ("Ravi", "Andhra Pradesh", "9876543210"),
        ("Sneha", "Telangana", "8765432109")
    ])

    # Sample crops
    cursor.executemany("""
        INSERT INTO crops (name, season, fertilizer, water_requirement)
        VALUES (?, ?, ?, ?)
    """, [
        ("Tomato", "Rabi", "Urea, Potash", "Medium"),
        ("Potato", "Kharif", "Ammonium Sulphate", "High"),
        ("Carrot", "Winter", "Compost", "Medium")
    ])

    # FAQ
    cursor.executemany("""
        INSERT INTO faq (question, answer)
        VALUES (?, ?)
    """, [
        ("How much water does tomato need?", "Tomatoes need moderate watering every 2–3 days."),
        ("Which fertilizer is best for potato?", "Ammonium Sulphate or Urea-based fertilizers are good for potatoes.")
    ])

    # Harvest info
    cursor.executemany("""
        INSERT INTO harvest_info (crop_name, harvest_date)
        VALUES (?, ?)
    """, [
        ("Tomato", "2025-03-15"),
        ("Potato", "2025-02-10"),
        ("Carrot", "2025-01-25")
    ])

    # Suppliers
    cursor.executemany("""
        INSERT INTO suppliers (crop_name, supplier_name, location, contact)
        VALUES (?, ?, ?, ?)
    """, [
        ("Tomato", "GreenGrow Supplies", "Hyderabad", "9123456789"),
        ("Potato", "AgriFarm Traders", "Guntur", "9876543212"),
        ("Carrot", "FreshField Supply Co.", "Vizag", "9988776655")
    ])

    conn.commit()
    conn.close()
    print("🌾 Sample data inserted successfully!")

if __name__ == "__main__":
    insert_sample_data()
